import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createObjectCsvWriter } from 'csv-writer';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blood_link_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

const initializePool = async () => {
  try {
    pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database successfully!');
    connection.release();
    
    // Create users table if not exists
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Users (
        UserID INT AUTO_INCREMENT PRIMARY KEY,
        Username VARCHAR(50) UNIQUE NOT NULL,
        Password VARCHAR(255) NOT NULL,
        Role ENUM('admin', 'staff') DEFAULT 'staff',
        Name VARCHAR(100) NOT NULL,
        Email VARCHAR(100),
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create default admin user
    await createDefaultUser();
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

const createDefaultUser = async () => {
  try {
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM Users');
    if (users[0].count === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.execute(
        'INSERT INTO Users (Username, Password, Role, Name, Email) VALUES (?, ?, ?, ?, ?)',
        ['admin', hashedPassword, 'admin', 'System Administrator', 'admin@bloodlink.com']
      );
      console.log('✅ Default admin user created: admin / admin123');
    }
  } catch (error) {
    console.error('Error creating default user:', error);
  }
};

// Initialize database connection
initializePool();

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ==============================
// AUTHENTICATION ROUTES
// ==============================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const [users] = await pool.execute(
      'SELECT * FROM Users WHERE Username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.Password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        userId: user.UserID, 
        username: user.Username, 
        role: user.Role,
        name: user.Name 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.UserID,
        username: user.Username,
        role: user.Role,
        name: user.Name,
        email: user.Email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, name, email, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool.execute(
      'INSERT INTO Users (Username, Password, Name, Email, Role) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, name, email, role || 'staff']
    );

    res.json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  res.json({ user: req.user });
});

// ==============================
// ENHANCED DASHBOARD ANALYTICS
// ==============================

app.get('/api/dashboard/analytics', authenticateToken, async (req, res) => {
  try {
    const [
      donorsCount,
      patientsCount,
      bloodUnitsCount,
      availableBloodCount,
      expiredBloodCount,
      issuedBloodCount,
      bloodInventory,
      nearExpiryCount,
      recentDonations,
      topDonors
    ] = await Promise.all([
      pool.execute('SELECT COUNT(*) as count FROM Donors'),
      pool.execute('SELECT COUNT(*) as count FROM Patients'),
      pool.execute('SELECT COUNT(*) as count FROM BloodUnits'),
      pool.execute('SELECT COUNT(*) as count FROM BloodUnits WHERE Status = "Available"'),
      pool.execute('SELECT COUNT(*) as count FROM BloodUnits WHERE Status = "Expired"'),
      pool.execute('SELECT COUNT(*) as count FROM BloodUnits WHERE Status = "Issued"'),
      pool.execute('SELECT * FROM BloodInventory ORDER BY BloodGroup'),
      pool.execute('SELECT COUNT(*) as count FROM BloodUnits WHERE ExpiryDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND Status = "Available"'),
      pool.execute('SELECT COUNT(*) as count FROM BloodUnits WHERE DonationDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)'),
      pool.execute(`
        SELECT d.Name, d.BloodGroup, COUNT(bu.BloodUnitID) as donations 
        FROM Donors d 
        LEFT JOIN BloodUnits bu ON d.DonorID = bu.DonorID 
        GROUP BY d.DonorID 
        ORDER BY donations DESC 
        LIMIT 5
      `)
    ]);

    const totalInventory = bloodInventory[0].reduce((sum, item) => sum + item.TotalQuantity, 0);
    
    res.json({
      overview: {
        donors: donorsCount[0][0].count,
        patients: patientsCount[0][0].count,
        totalBloodUnits: bloodUnitsCount[0][0].count,
        availableBloodUnits: availableBloodCount[0][0].count,
        expiredBloodUnits: expiredBloodCount[0][0].count,
        issuedBloodUnits: issuedBloodCount[0][0].count,
        totalInventory,
        nearExpiryUnits: nearExpiryCount[0][0].count,
        recentDonations: recentDonations[0][0].count
      },
      bloodInventory: bloodInventory[0],
      topDonors: topDonors[0],
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==============================
// SEARCH & FILTER ENDPOINTS
// ==============================

app.get('/api/donors/search', authenticateToken, async (req, res) => {
  try {
    const { name, bloodGroup, page = 1, limit = 10 } = req.query;
    let query = 'SELECT * FROM Donors WHERE 1=1';
    const params = [];

    if (name) {
      query += ' AND Name LIKE ?';
      params.push(`%${name}%`);
    }

    if (bloodGroup) {
      query += ' AND BloodGroup = ?';
      params.push(bloodGroup);
    }

    query += ' ORDER BY DonorID DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * limit;
    params.push(parseInt(limit), offset);

    const [rows] = await pool.execute(query, params);
    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM Donors WHERE 1=1');

    res.json({
      donors: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/blood-units/filter', authenticateToken, async (req, res) => {
  try {
    const { bloodGroup, status, donorName, page = 1, limit = 10 } = req.query;
    
    let query = `
      SELECT bu.*, d.Name as DonorName, p.Name as PatientName 
      FROM BloodUnits bu
      LEFT JOIN Donors d ON bu.DonorID = d.DonorID
      LEFT JOIN Patients p ON bu.PatientID = p.PatientID
      WHERE 1=1
    `;
    const params = [];

    if (bloodGroup) {
      query += ' AND bu.BloodGroup = ?';
      params.push(bloodGroup);
    }

    if (status) {
      query += ' AND bu.Status = ?';
      params.push(status);
    }

    if (donorName) {
      query += ' AND d.Name LIKE ?';
      params.push(`%${donorName}%`);
    }

    query += ' ORDER BY bu.DonationDate DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * limit;
    params.push(parseInt(limit), offset);

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Filter error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==============================
// EXPIRY ALERTS
// ==============================

app.get('/api/alerts/expiry', authenticateToken, async (req, res) => {
  try {
    const [nearExpiry] = await pool.execute(`
      SELECT bu.*, d.Name as DonorName, 
             DATEDIFF(bu.ExpiryDate, CURDATE()) as days_until_expiry
      FROM BloodUnits bu
      LEFT JOIN Donors d ON bu.DonorID = d.DonorID
      WHERE bu.ExpiryDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        AND bu.Status = 'Available'
      ORDER BY bu.ExpiryDate ASC
    `);

    const [criticalInventory] = await pool.execute(`
      SELECT * FROM BloodInventory 
      WHERE TotalQuantity <= 2
      ORDER BY TotalQuantity ASC
    `);

    res.json({
      nearExpiry,
      criticalInventory,
      alertCount: nearExpiry.length + criticalInventory.length
    });
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==============================
// EXPORT/REPORTS ENDPOINTS
// ==============================

app.get('/api/export/donors/csv', authenticateToken, async (req, res) => {
  try {
    const [donors] = await pool.execute('SELECT * FROM Donors ORDER BY DonorID');

    const csvWriter = createObjectCsvWriter({
      path: 'temp/donors_export.csv',
      header: [
        { id: 'DonorID', title: 'Donor ID' },
        { id: 'Name', title: 'Name' },
        { id: 'Age', title: 'Age' },
        { id: 'Gender', title: 'Gender' },
        { id: 'Contact', title: 'Contact' },
        { id: 'BloodGroup', title: 'Blood Group' },
        { id: 'Address', title: 'Address' },
        { id: 'MedicalHistory', title: 'Medical History' }
      ]
    });

    await csvWriter.writeRecords(donors);
    
    res.download('temp/donors_export.csv', `donors_export_${new Date().toISOString().split('T')[0]}.csv`);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/export/inventory/pdf', authenticateToken, async (req, res) => {
  try {
    const [inventory] = await pool.execute('SELECT * FROM BloodInventory ORDER BY BloodGroup');
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=blood_inventory_${new Date().toISOString().split('T')[0]}.pdf`);
    
    doc.pipe(res);
    
    // PDF content
    doc.fontSize(20).text('Blood Inventory Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();
    
    inventory.forEach(item => {
      doc.text(`${item.BloodGroup}: ${item.TotalQuantity} units`);
    });
    
    doc.end();
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==============================
// ENHANCED CRUD OPERATIONS (Protected)
// ==============================

// Donors CRUD
app.get('/api/donors', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Donors ORDER BY DonorID DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/donors', authenticateToken, async (req, res) => {
  try {
    const { Name, Age, Gender, Contact, Address, BloodGroup, MedicalHistory } = req.body;
    
    const [result] = await pool.execute(
      'CALL sp_add_donor(?, ?, ?, ?, ?, ?, ?)',
      [Name, Age, Gender, Contact, Address, BloodGroup, MedicalHistory || '']
    );
    
    res.json({ message: 'Donor added successfully', result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/donors/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { Name, Age, Gender, Contact, Address, BloodGroup, MedicalHistory } = req.body;
    
    const [result] = await pool.execute(
      `UPDATE Donors SET Name=?, Age=?, Gender=?, Contact=?, Address=?, BloodGroup=?, MedicalHistory=? 
       WHERE DonorID=?`,
      [Name, Age, Gender, Contact, Address, BloodGroup, MedicalHistory, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Donor not found' });
    }
    
    res.json({ message: 'Donor updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/donors/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM Donors WHERE DonorID = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Donor not found' });
    }
    
    res.json({ message: 'Donor deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Patients CRUD
app.get('/api/patients', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.*, h.Name as HospitalName 
      FROM Patients p 
      LEFT JOIN Hospitals h ON p.HospitalID = h.HospitalID 
      ORDER BY p.PatientID DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/patients', authenticateToken, async (req, res) => {
  try {
    const { Name, BloodGroup, Gender, Contact, HospitalID } = req.body;
    
    const [countResult] = await pool.execute('SELECT COUNT(*) as count FROM Patients');
    const newPatientID = `PAT${String(parseInt(countResult[0].count) + 1).padStart(4, '0')}`;
    
    await pool.execute(
      `INSERT INTO Patients (PatientID, Name, BloodGroup, Gender, Contact, HospitalID)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [newPatientID, Name, BloodGroup, Gender, Contact, HospitalID]
    );
    
    res.json({ message: 'Patient added successfully', patientId: newPatientID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Blood Units CRUD
app.get('/api/blood-units', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT bu.*, d.Name as DonorName, p.Name as PatientName, h.Name as HospitalName
      FROM BloodUnits bu
      LEFT JOIN Donors d ON bu.DonorID = d.DonorID
      LEFT JOIN Patients p ON bu.PatientID = p.PatientID
      LEFT JOIN Hospitals h ON p.HospitalID = h.HospitalID
      ORDER BY bu.DonationDate DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/blood-units', authenticateToken, async (req, res) => {
  try {
    const { BloodGroup, DonationDate, ExpiryDate, DonorID } = req.body;
    
    const currentYear = new Date().getFullYear();
    const [countResult] = await pool.execute('SELECT COUNT(*) as count FROM BloodUnits WHERE BloodUnitID LIKE ?', [`BU${currentYear}%`]);
    const newBloodUnitID = `BU${currentYear}${String(parseInt(countResult[0].count) + 1).padStart(4, '0')}`;
    
    await pool.execute(
      `INSERT INTO BloodUnits (BloodUnitID, BloodGroup, DonationDate, ExpiryDate, DonorID, Status)
       VALUES (?, ?, ?, ?, ?, 'Available')`,
      [newBloodUnitID, BloodGroup, DonationDate, ExpiryDate, DonorID]
    );
    
    res.json({ message: 'Blood unit added successfully', bloodUnitId: newBloodUnitID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Hospitals CRUD
app.get('/api/hospitals', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Hospitals ORDER BY Name');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Staff CRUD
app.get('/api/staff', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Staff ORDER BY Role, Name');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==============================
// SPECIAL OPERATIONS
// ==============================

app.post('/api/issue-blood', authenticateToken, async (req, res) => {
  try {
    const { BloodUnitID, PatientID } = req.body;
    await pool.execute('CALL sp_issue_blood_unit(?, ?)', [BloodUnitID, PatientID]);
    res.json({ message: 'Blood unit issued successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/remove-expired-blood', authenticateToken, async (req, res) => {
  try {
    await pool.execute('CALL sp_remove_expired_blood()');
    res.json({ message: 'Expired blood units removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/blood-inventory', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM BloodInventory ORDER BY BloodGroup');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check (public)
app.get('/api/health', async (req, res) => {
  try {
    const [dbResult] = await pool.execute('SELECT COUNT(*) as count FROM Donors');
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      totalDonors: dbResult[0].count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'Error', database: 'Disconnected', error: error.message });
  }
});
// ==============================
// ENHANCED PATIENT ROUTES
// ==============================

// Add new patient
app.post('/api/patients', authenticateToken, async (req, res) => {
  try {
    const { Name, BloodGroup, Gender, Contact, HospitalID } = req.body;
    
    console.log('Adding patient:', { Name, BloodGroup, HospitalID });
    
    await pool.execute(
      'CALL sp_add_patient(?, ?, ?, ?, ?)',
      [Name, BloodGroup, Gender, Contact, HospitalID]
    );
    
    res.json({ message: 'Patient added successfully' });
  } catch (error) {
    console.error('Error adding patient:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==============================
// ENHANCED HOSPITAL ROUTES
// ==============================

// Add new hospital (Admin only)
app.post('/api/hospitals', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { Name, Location } = req.body;
    
    console.log('Adding hospital:', { Name, Location });
    
    await pool.execute(
      'CALL sp_add_hospital(?, ?)',
      [Name, Location]
    );
    
    res.json({ message: 'Hospital added successfully' });
  } catch (error) {
    console.error('Error adding hospital:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==============================
// ENHANCED BLOOD UNIT ROUTES
// ==============================

// Add new blood unit
app.post('/api/blood-units', authenticateToken, async (req, res) => {
  try {
    const { BloodGroup, DonationDate, ExpiryDate, DonorID } = req.body;
    
    console.log('Adding blood unit:', { BloodGroup, DonorID });
    
    await pool.execute(
      'CALL sp_add_blood_unit(?, ?, ?, ?)',
      [BloodGroup, DonationDate, ExpiryDate, DonorID]
    );
    
    res.json({ message: 'Blood unit added successfully' });
  } catch (error) {
    console.error('Error adding blood unit:', error);
    res.status(500).json({ error: error.message });
  }
});
// ==============================
// ENHANCED HOSPITAL ROUTES WITH UPDATE/DELETE
// ==============================

// Update hospital
app.put('/api/hospitals/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { Name, Location } = req.body;
    
    const [result] = await pool.execute(
      `UPDATE Hospitals SET Name = ?, Location = ? WHERE HospitalID = ?`,
      [Name, Location, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    
    res.json({ message: 'Hospital updated successfully' });
  } catch (error) {
    console.error('Error updating hospital:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete hospital
app.delete('/api/hospitals/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if there are patients associated with this hospital
    const [patients] = await pool.execute('SELECT COUNT(*) as count FROM Patients WHERE HospitalID = ?', [id]);
    
    if (patients[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete hospital. There are patients associated with this hospital.' 
      });
    }
    
    const [result] = await pool.execute('DELETE FROM Hospitals WHERE HospitalID = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    
    res.json({ message: 'Hospital deleted successfully' });
  } catch (error) {
    console.error('Error deleting hospital:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==============================
// STAFF CRUD OPERATIONS
// ==============================

// GET all staff
app.get('/api/staff', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Staff ORDER BY Role, Name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: error.message });
  }
});



// GET staff by ID
app.get('/api/staff/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM Staff WHERE StaffID = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST new staff
app.post('/api/staff', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { Name, Role } = req.body;
    
    // Generate new StaffID
    const [countResult] = await pool.execute('SELECT COUNT(*) as count FROM Staff');
    const newStaffID = `STF${String(parseInt(countResult[0].count) + 1).padStart(3, '0')}`;
    
    const [result] = await pool.execute(
      `INSERT INTO Staff (StaffID, Name, Role)
       VALUES (?, ?, ?)`,
      [newStaffID, Name, Role]
    );
    
    res.json({ 
      message: 'Staff added successfully', 
      staffId: newStaffID 
    });
  } catch (error) {
    console.error('Error adding staff:', error);
    
    // Handle duplicate entry error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: 'Staff member with this name and role already exists' 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// UPDATE staff
app.put('/api/staff/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { Name, Role } = req.body;
    
    // Use the stored procedure for update
    await pool.execute('CALL sp_update_staff(?, ?, ?)', [id, Name, Role]);
    
    res.json({ message: 'Staff updated successfully' });
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE staff
app.delete('/api/staff/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute('DELETE FROM Staff WHERE StaffID = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    
    res.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({ error: error.message });
  }
});


// Create temp directory for exports
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (!fs.existsSync('temp')) {
  fs.mkdirSync('temp');
}


// ==============================================
// ROLE-BASED DATABASE CONNECTION POOLING (ADDED)
// ==============================================

// Create 2 separate pools for MySQL RBAC
const adminPool = mysql.createPool({
  host: process.env.DB_HOST,
  user: "app_admin",               // MySQL 8 admin role user
  password: "Admin_DB_Pass123!",   // same as DCL script
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

const staffPool = mysql.createPool({
  host: process.env.DB_HOST,
  user: "app_staff",               // MySQL 8 staff role user
  password: "Staff_DB_Pass123!",   // same password from DCL
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// Universal “get DB by role”
export const getDbByRole = (role) => {
  if (role === "admin") return adminPool;
  return staffPool;  // staff, or any non-admin
};

// Override pool dynamically per request
app.use((req, res, next) => {
  if (req.user && req.user.role) {
    req.db = getDbByRole(req.user.role);
  } else {
    req.db = pool;   // default fallback (existing pool)
  }
  next();
});




app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔐 JWT Authentication Enabled`);
  console.log(`📊 Analytics Dashboard Ready`);
  console.log(`📄 Export/Report Features Active`);
});