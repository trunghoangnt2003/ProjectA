using System;
using Npgsql;

var connectionString = "Host=localhost;Port=5432;Database=projecta;Username=postgres;Password=123";
using var conn = new NpgsqlConnection(connectionString);
conn.Open();

var cmd = new NpgsqlCommand("TRUNCATE TABLE \"Courts\" CASCADE;", conn);
cmd.ExecuteNonQuery();

cmd = new NpgsqlCommand("TRUNCATE TABLE \"Customers\" CASCADE;", conn);
cmd.ExecuteNonQuery();

cmd = new NpgsqlCommand("TRUNCATE TABLE \"Products\" CASCADE;", conn);
cmd.ExecuteNonQuery();

cmd = new NpgsqlCommand("TRUNCATE TABLE \"Bookings\" CASCADE;", conn);
cmd.ExecuteNonQuery();

cmd = new NpgsqlCommand("TRUNCATE TABLE \"Orders\" CASCADE;", conn);
cmd.ExecuteNonQuery();

cmd = new NpgsqlCommand("TRUNCATE TABLE \"Payments\" CASCADE;", conn);
cmd.ExecuteNonQuery();

cmd = new NpgsqlCommand("TRUNCATE TABLE \"Supplies\" CASCADE;", conn);
cmd.ExecuteNonQuery();

Console.WriteLine("Database tables truncated successfully!");
