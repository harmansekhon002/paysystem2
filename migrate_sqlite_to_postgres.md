# Example migration steps
# 1. Export SQLite data to CSV
# 2. Import CSV into PostgreSQL

# Export SQLite table to CSV
# sqlite3 db.sqlite3 ".headers on" ".mode csv" "SELECT * FROM user;" > user.csv

# Import CSV into PostgreSQL
# \copy user FROM 'user.csv' DELIMITER ',' CSV HEADER;

# Or use pgloader for direct migration
# pgloader sqlite:///db.sqlite3 postgresql://<user>:<password>@<host>:<port>/<database>
