var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var mysql = require('mysql2');

// MySQL database connection configuration
var connection = mysql.createConnection({
    host     : 'localhost', // or the IP address of your MySQL server
    user     : 'root', // your MySQL username
    password : 'asaar123//2', // your MySQL password
    database : '0ilaew5myh' // your database name
});

// Connect to the MySQL database
connection.connect(function(err) {
    if (err) throw err;
    console.log('Connected to the MySQL server.');
});

app.get('/getAllProducts', function(req, res) {
    // Query the database
    connection.query('SELECT * FROM products WHERE display=1', function (error, results, fields) {
        if (error) throw error;
        // Send query results as JSON response
        res.json(results);
    });
});

app.get('/getAllCategories', function(req, res) {
    // Query the database and sort by "order" column in ascending order
    connection.query('SELECT * FROM categories WHERE display=1 ORDER BY `order` ASC', function (error, results, fields) {
        if (error) throw error;
        // Send query results as JSON response
        res.json(results);
    });
});

// /category/:id
//get category by id
app.get('/category/:id', function(req, res) {
    // Query the database
    connection.query('SELECT * FROM categories WHERE id = ?', [req.params.id], function (error, results, fields) {
        if (error) throw error;
        // Send query results as JSON response
        res.json(results);
    });
});

// /getProductsByCategory/:id

app.get('/getProductsByCategory/:id', function(req, res) {
    // Query the database
    connection.query('SELECT * FROM products WHERE id_category = ? AND display=1', [req.params.id], function (error, results, fields) {
        if (error) throw error;
        // Send query results as JSON response
        res.json(results);
    });
});

// /types
app.get('/types', function(req, res) {
    // Query the database
    connection.query('SELECT * FROM types WHERE display=1', function (error, results, fields) {
        if (error) throw error;
        // Send query results as JSON response
        res.json(results);
    });
});

// /regions

app.get('/regions', function(req, res) {
    // Query the database
    connection.query('SELECT * FROM regions WHERE display=1', function (error, results, fields) {
        if (error) throw error;
        // Send query results as JSON response
        res.json(results);
    });
});

// /prixRegion?marche=1&id_category=6&start_date=2023-12-01&end_date=2023-12-30&region=4
app.get('/prixRegion', function(req, res) {
    // Validate request parameters
    const { marche, id_category, region, start_date, end_date } = req.query;

    // Check if all required query parameters are provided
    if (!marche || !id_category || !region || !start_date || !end_date) {
        return res.status(400).json({ error: "All parameters are required" });
    }

    // Convert parameters to appropriate types for safety
    const numMarche = parseInt(marche);
    const numIdCategory = parseInt(id_category);
    const numRegion = parseInt(region);

    // Validate converted parameters
    if(isNaN(numMarche) || isNaN(numIdCategory) || isNaN(numRegion)) {
        return res.status(400).json({ error: "Invalid parameter types" });
    }

    // Validate date formats (simple validation)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date) || !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
        return res.status(400).json({ error: "Invalid date format, should be YYYY-MM-DD" });
    }

    // Fetch product IDs by category and display status
    connection.query('SELECT id FROM products WHERE id_category = ? AND display = 1', [numIdCategory], function (error, results, fields) {
        if (error) return res.status(500).json({ error: error.message });

        // Extract product IDs from query results
        const productIds = results.map(product => product.id);
        if (productIds.length === 0) {
            return res.status(404).json({ error: "No products found for this category" });
        }

        // Construct placeholders for SQL query based on the number of product IDs
        const placeholders = productIds.map(() => '?').join(',');
        const queryParams = [numRegion, numMarche, start_date, end_date, ...productIds];

        // Construct the SQL query to get price data
        let sql = `SELECT id_product, date, moyen, minimum, maximum FROM price_by_regions WHERE id_region = ? AND id_type = ? AND date BETWEEN ? AND ? AND id_product IN (${placeholders}) ORDER BY date ASC`;

        connection.query(sql, queryParams, function (error, priceData, fields) {
            if (error) return res.status(500).json({ error: error.message });

            // Group price data by product ID
            let groupedPriceData = {};
            priceData.forEach((item) => {
                if (!groupedPriceData[item.id_product]) {
                    groupedPriceData[item.id_product] = [];
                }
                groupedPriceData[item.id_product].push(item);
            });

            res.json(groupedPriceData);
        });
    });
});

app.get('/prixNational', function(req, res) {
    // Validate request parameters
    const { marche, id_category, start_date, end_date } = req.query;

    // Check if all required query parameters are provided
    if (!marche || !id_category || !start_date || !end_date) {
        return res.status(400).json({ error: "All parameters are required" });
    }

    // Convert parameters to appropriate types for safety
    const numMarche = parseInt(marche);
    const numIdCategory = parseInt(id_category);

    // Validate converted parameters
    if(isNaN(numMarche) || isNaN(numIdCategory)) {
        return res.status(400).json({ error: "Invalid parameter types" });
    }

    // Validate date formats (simple validation)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date) || !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
        return res.status(400).json({ error: "Invalid date format, should be YYYY-MM-DD" });
    }

    // Fetch product IDs by category and display status
    connection.query('SELECT id FROM products WHERE id_category = ? AND display = 1', [numIdCategory], function (error, results, fields) {
        if (error) return res.status(500).json({ error: error.message });

        // Extract product IDs from query results
        const productIds = results.map(product => product.id);
        if (productIds.length === 0) {
            return res.status(404).json({ error: "No products found for this category" });
        }

        // Construct placeholders for SQL query based on the number of product IDs
        const placeholders = productIds.map(() => '?').join(',');
        const queryParams = [numMarche, start_date, end_date, ...productIds];

        // Construct the SQL query to get price data
        let sql = `SELECT id_product, date, moyen, minimum, maximum FROM price_nationals WHERE id_type = ? AND date BETWEEN ? AND ? AND id_product IN (${placeholders}) ORDER BY date ASC`;

        connection.query(sql, queryParams, function (error, priceData, fields) {
            if (error) return res.status(500).json({ error: error.message });

            // Group price data by product ID
            let groupedPriceData = {};
            priceData.forEach((item) => {
                if (!groupedPriceData[item.id_product]) {
                    groupedPriceData[item.id_product] = [];
                }
                groupedPriceData[item.id_product].push(item);
            });

            res.json(groupedPriceData);
        });
    });
});



app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});
