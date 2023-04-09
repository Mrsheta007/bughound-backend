const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const csv = require("csv");

const mysql2 = require("mysql2");
const app = express();
const port = 3000;
const fs = require("fs");

app.use(bodyParser.json());
app.use(cors());

const db = mysql.createConnection({
  host: "database-1.cetyx1ft5uhn.us-east-2.rds.amazonaws.com",
  port: "3306",
  user: "admin",
  password: "password",
  database: "bughound",
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("Connected to MySQL database");
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.get("/export/:tableName", (req, res) => {
  const tableName = req.params.tableName;
  const query = `SELECT * FROM ${tableName}`;
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Server error");
    }
    const fields = Object.keys(results[0]);
    fields.push("timestamp");
    const opts = { fields };
    const now = new Date();
    results.forEach((result) => {
      result.timestamp = now;
    });
    csv.stringify(results, opts, (err, output) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Server error");
      }
      const fileName = `${tableName}_${now.getTime()}.csv`;
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.setHeader("Content-Type", "text/csv");
      res.status(200).send(output);
    });
  });
});

// Define the endpoint for adding an employee
app.post("/addemployee", (req, res) => {
  const { name, username, password, userLevel } = req.body;
  console.log("we are adding this emplyoee (backend):", req.body);
  // Create the table for the new employee if it does not exist
  db.query(
    "CREATE TABLE IF NOT EXISTS employees (id INT NOT NULL AUTO_INCREMENT, name VARCHAR(255) NOT NULL, username VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL, user_level VARCHAR(255) NOT NULL, PRIMARY KEY (id))",
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error creating table");
      } else {
        console.log("Table created or already exists");
      }
    }
  );

  // Insert the new employee into the table
  db.query(
    "INSERT INTO employees (name, username, password, user_level) VALUES (?, ?, ?, ?)",
    [name, username, password, userLevel],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error creating employee");
      } else {
        console.log("New employee created with ID:", result.insertId);
        res.send("New employee created");
      }
    }
  );
});

// Add Program
app.post("/addprograms", (req, res) => {
  const { name, version, rel } = req.body;

  console.log("is this even executing??????????????????????");

  // Check if add_program table exists, create one if it doesn't exist
  db.query(
    "CREATE TABLE IF NOT EXISTS addprogram (id INT NOT NULL AUTO_INCREMENT, name VARCHAR(255), version INT, rel INT, PRIMARY KEY (id))",
    (err) => {
      if (err) throw err;

      // Insert program data into add_program table
      db.query(
        "INSERT INTO addprogram (name, version, rel) VALUES (?, ?, ?)",
        [name, version, rel],
        (err) => {
          if (err) throw err;
          console.log("Program added successfully!");
          res.status(200).send("Program added successfully!");
        }
      );
    }
  );
});

// Get Programs
app.get("/getprograms", (req, res) => {
  // Check if add_program table exists
  db.query(
    `CREATE TABLE IF NOT EXISTS addprogram (
      id INT NOT NULL AUTO_INCREMENT,
      name VARCHAR(255),
      version INT,
      rel INT,
      PRIMARY KEY (id)
    )`,
    (err) => {
      if (err) throw err;

      // Retrieve program data from add_program table
      db.query("SELECT * FROM addprogram", (err, results) => {
        if (err) throw err;
        // console.log("this is the backend of the getprogram:---:", results);
        res.status(200).json(results);
      });
    }
  );
});

app.get("/getoneprogram/:id", (req, res) => {
  // Check if add_program table exists
  const { id } = req.params;

  // Retrieve program data from add_program table
  db.query(
    `SELECT addprogram.name,addprogram.id 
  FROM bug 
  JOIN addprogram 
  ON bug.program_id = addprogram.id 
  WHERE bug.id = ${id};`,
    (err, results) => {
      if (err) throw err;
      // console.log("this is the backend of the getprogram:---:", results);
      res.status(200).json(results);
    }
  );
});

app.get("/getemployees", (req, res) => {
  // Check if add_program table exists
  console.log("this is the test of get employees:");
  db.query(
    "CREATE TABLE IF NOT EXISTS employees (name VARCHAR(255),username VARCHAR(255),password VARCHAR(255), user_level VARCHAR(255))",
    (err) => {
      if (err) throw err;

      // Retrieve program data from add_program table
      db.query("SELECT * FROM employees", (err, results) => {
        if (err) throw err;
        res.status(200).json(results);
      });
    }
  );
});

app.get("/getemployee/:employee_id", (req, res) => {
  const employee_id = req.params.employee_id;
  // console.log("this is the code backend -------------------------:", programId);
  const query = `SELECT * FROM employees WHERE id=${employee_id}`;

  db.query(query, function (error, results, fields) {
    if (error) throw error;

    console.log(
      "this is the restult of the qury$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$",
      results
    );
    res.send(results);
  });
});

// Add a new area
app.post("/addarea", (req, res) => {
  console.log("req.body:", req.body);

  db.query(
    `
  CREATE TABLE IF NOT EXISTS areas (
    area_id INT NOT NULL AUTO_INCREMENT,
    program_id INT NOT NULL,
    area_name VARCHAR(255),
    PRIMARY KEY (area_id),
    FOREIGN KEY (program_id) REFERENCES addprogram(id)
  )`,
    (error) => {
      if (error) {
        console.log("Error creating areas table:", error);
      } else {
        console.log("Areas table created successfully");
      }
    }
  );
  const { programId, area } = req.body;
  db.query(
    "INSERT INTO areas (program_id, area_name) VALUES (?, ?)",
    [programId, area],
    (error, results) => {
      if (error) {
        console.log("Error adding area:", error);
        res.sendStatus(500);
      } else {
        console.log("Area added successfully");
        res.sendStatus(200);
      }
    }
  );
});

app.put("/updateemployee/:id", (req, res) => {
  console.log("we are in edit employee catatagory");

  const id = req.params.id;
  const { name, user_level } = req.body;

  db.query(
    "UPDATE employees SET name = ?, user_level = ? WHERE id = ?",
    [name, user_level, id],
    (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      } else {
        console.log(`Employee with ID ${id} updated successfully`);
        res
          .status(200)
          .json({ message: `Employee with ID ${id} updated successfully` });
      }
    }
  );
});
// Update an existing area
app.put("/updatearea/:id", (req, res) => {
  const { id } = req.params;
  const { area_name } = req.body;

  // Check if the area name is provided
  if (!area_name) {
    return res.status(400).json({ message: "Area name is required" });
  }
  // console.log(
  //   "THIS IS ACTUAL BACKEND OF THE UPDATE AREA:--------------------------------------->",
  //   id,
  //   area_name
  // );
  // Update the area in the database
  db.query(
    "UPDATE areas SET area_name = ? WHERE area_id = ?",
    [area_name, id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
      }

      // Check if the area was updated successfully
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Area not found" });
      }

      res.json({ message: "Area updated successfully" });
    }
  );
});

app.put("/editbug/:bugid", (req, res) => {
  const bugid = req.params.bugid;
  console.log("this is received data:", req.body);
  const formData = req.body;

  // create an array of key-value pairs from the formData
  const updateFields = Object.entries(formData)
    .map(([key, value]) => {
      if (value === null && (key === "resdate" || key === "date")) {
        return `${key} = null`;
      } else {
        return `${key} = '${value}'`;
      }
    })
    .join(", ");

  // build the SQL query to update the bug table with the specified fields
  const sql = `UPDATE bug SET ${updateFields} WHERE id = ${bugid}`;

  // execute the SQL query using the connection pool
  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update bug" });
    } else {
      res.status(200).json({ message: "Bug updated successfully" });
    }
  });
});
db.query(`CREATE TABLE IF NOT EXISTS areas (
        area_id INT NOT NULL AUTO_INCREMENT,
        program_id INT NOT NULL,
        area_name VARCHAR(255),
        PRIMARY KEY (area_id),
        FOREIGN KEY (program_id) REFERENCES addprogram(id)
      )`);
app.get("/getareas/:programId", function (req, res) {
  const programId = req.params.programId;
  //console.log("this is get areas -------------------------:", programId);
  const query = `SELECT area_id, area_name FROM areas WHERE program_id=${programId}`;

  db.query(query, function (error, results, fields) {
    if (results.length > 0) {
      // console.log(
      //   "this is the restult of the qury$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$",
      //   results
      // );
      res.send(results);
    } else {
      const createTableQuery = `
      CREATE TABLE IF NOT EXISTS areas (
        area_id INT NOT NULL AUTO_INCREMENT,
        program_id INT NOT NULL,
        area_name VARCHAR(255),
        PRIMARY KEY (area_id),
        FOREIGN KEY (program_id) REFERENCES addprogram(id)
      )`;

      db.query(createTableQuery, function (error, results, fields) {
        if (error) throw error;

        res.send([]);
      });
    }
  });
});

app.get("/getbug/:bugid", function (req, res) {
  const programId = req.params.bugid;
  // console.log("this is the code backend -------------------------:", programId);
  const query = `SELECT * FROM bug WHERE id=${programId}`;

  db.query(query, function (error, results, fields) {
    if (error) throw error;
    ///onsole.log(":::::::::::::::::::::", results);
    res.send(results);
  });
});

app.post("/addbug", (req, res) => {
  const createTableQuery = `CREATE TABLE IF NOT EXISTS bug (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT,
    report_type VARCHAR(255),
    severity VARCHAR(255),
    problem VARCHAR(255),
    problem_summary VARCHAR(255),
    reported_by VARCHAR(255),
    date DATE,
    area VARCHAR(255),
    assigned_to VARCHAR(255),
    comments VARCHAR(255),
    status VARCHAR(255),
    priority VARCHAR(255),
    resolution VARCHAR(255),
    resolution_version VARCHAR(255),
    treat_as VARCHAR(255),
    resolved_by VARCHAR(255),
    resdate DATE,
    tested_by VARCHAR(255)
  )`;

  db.query(createTableQuery, (err, result) => {
    if (err) throw err;
    //console.log("Bug table created or already exists");
  });

  const {
    program,
    reportType,
    severity,
    problem,
    problemSummary,
    reportedBy,
    date,
    area,
    assignedto,
    comments,
    status,
    priority,
    resolution,
    resolution_version,
    treat_as,
    ResolvedBy,
    resdate,
    TestedBy,
  } = req.body;

  const insertQuery = `INSERT INTO bug (program_id, report_type, severity, problem, problem_summary, reported_by, date, area, assigned_to, comments, status, priority, resolution, resolution_version, treat_as, resolved_by, resdate, tested_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    program,
    reportType,
    severity,
    problem,
    problemSummary,
    reportedBy,
    date,
    area,
    assignedto,
    comments,
    status,
    priority,
    resolution,
    resolution_version,
    treat_as,
    ResolvedBy,
    resdate,
    TestedBy,
  ];

  db.query(insertQuery, values, (err, result) => {
    if (err) throw err;
    //console.log(result);
    res.send("Bug report added successfully!");
  });
});

app.get("/searchresult", (req, res) => {
  db.query(
    `
    SELECT b.id, p.name, b.problem_summary
    FROM bug b
    JOIN addprogram p ON b.program_id = p.id
  `,
    (err, result) => {
      if (err) throw err;
      res.send(result);
    }
  );
});

// db.query(`CREATE TABLE files (
//   id INT PRIMARY KEY AUTO_INCREMENT,
//   name VARCHAR(255) NOT NULL,
//   mimetype VARCHAR(255) NOT NULL,
//   size INT NOT NULL,
//   path VARCHAR(255) NOT NULL,
//   bug_id INT NOT NULL,
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   FOREIGN KEY (bug_id) REFERENCES bug(id)
// );`);

app.post("/api/upload", upload.single("file"), (req, res) => {
  console.log("this is bug id:------------------:", req.body.bug_id);
  const file = req.file;
  const bugId = req.body.bug_id;

  if (!file) {
    // If no file is uploaded, send a response with an error message
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const selectSql = "SELECT path FROM files WHERE bug_id = ?";
  db.query(selectSql, [bugId], (error, results, fields) => {
    if (error) throw error;
    if (results.length > 0) {
      // If there is an existing file for this bug ID, delete it
      const oldFilePath = results[0].path;
      fs.unlink(oldFilePath, (err) => {
        if (err) throw err;

        // Then insert the new file
        const updateSql =
          "UPDATE files SET name = ?, mimetype = ?, size = ?, path = ? WHERE bug_id = ?";
        db.query(
          updateSql,
          [file.originalname, file.mimetype, file.size, file.path, bugId],
          (error, results, fields) => {
            if (error) throw error;
            res.json({ success: true });
          }
        );
      });
    } else {
      // If there is no existing file, insert the new one
      const insertSql =
        "INSERT INTO files (name, mimetype, size, path, bug_id) VALUES (?, ?, ?, ?, ?)";
      db.query(
        insertSql,
        [file.originalname, file.mimetype, file.size, file.path, bugId],
        (error, results, fields) => {
          if (error) throw error;
          res.json({ success: true });
        }
      );
    }
  });
});

app.get("/api/getfiles/:bugid", (req, res) => {
  console.log("this is get bug with the id:", req.params.bugid);
  const bugId = req.params.bugid;
  const sql = "SELECT * FROM files WHERE bug_id = ?";
  db.query(sql, [bugId], (error, results, fields) => {
    if (error) throw error;

    console.log(results);
    res.json(results);
  });
});

app.get("/api/filesdownload/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM files WHERE bug_id = ?";
  db.query(sql, [id], (error, results, fields) => {
    if (error) throw error;
    const { name, path, mimetype } = results[0];
    res.setHeader("Content-Disposition", `attachment; filename=${name}`);
    res.setHeader("Content-Type", mimetype);
    res.download(path);
  });
});

app.post("/login", (req, res) => {
  console.log(
    "this is here at the login page of----------------->>>>>>>>>>>>>>>>>>>>"
  );
  const username = req.body.username;
  const password = req.body.password;

  // Query the MySQL database for the employee
  const query = `SELECT * FROM employees WHERE username = ? AND password = ?`;
  db.query(query, [username, password], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (result.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const employee = result[0];
    const response = {
      name: employee.name,
      userlevel: employee.user_level,
    };
    // console.log(
    //   //"this is the resopnse from the ******** backend:-------",
    //   response
    // );
    return res.status(200).json(response);
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${3000}`);
});
