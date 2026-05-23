using Microsoft.EntityFrameworkCore;
using ProjectA.Models;

namespace ProjectA.Data
{
    public static partial class DbSeeder
    {
        private static async Task SeedDomainDataAsync(AppDbContext db)
        {
            var rng = new Random(42);

            // 1. Courts
            if (!await db.Courts.AnyAsync())
            {
                List<PriceSlot> GetStandardSlots() => new List<PriceSlot>
                {
                    new() { Start = "05:00", End = "16:00", PricePerHour = 80000 },
                    new() { Start = "16:00", End = "22:00", PricePerHour = 130000 },
                    new() { Start = "22:00", End = "24:00", PricePerHour = 100000 },
                };
                
                List<PriceSlot> GetVipSlots() => new List<PriceSlot>
                {
                    new() { Start = "05:00", End = "16:00", PricePerHour = 180000 },
                    new() { Start = "16:00", End = "22:00", PricePerHour = 250000 },
                    new() { Start = "22:00", End = "24:00", PricePerHour = 200000 },
                };

                db.Courts.AddRange(
                    new Court { Id = Guid.NewGuid(), Name = "Sân 1", Zone = "Khu A", Type = "standard", PriceSlots = GetStandardSlots(), WeekendSurcharge = 10, HolidaySurcharge = 20, MemberDiscount = 5, Status = "available" },
                    new Court { Id = Guid.NewGuid(), Name = "Sân 2", Zone = "Khu A", Type = "standard", PriceSlots = GetStandardSlots(), WeekendSurcharge = 10, HolidaySurcharge = 20, MemberDiscount = 5, Status = "available" },
                    new Court { Id = Guid.NewGuid(), Name = "Sân 3", Zone = "Khu A", Type = "standard", PriceSlots = GetStandardSlots(), WeekendSurcharge = 10, HolidaySurcharge = 20, MemberDiscount = 5, Status = "available" },
                    new Court { Id = Guid.NewGuid(), Name = "Sân 4", Zone = "Khu B", Type = "competition", PriceSlots = GetStandardSlots(), WeekendSurcharge = 15, HolidaySurcharge = 25, MemberDiscount = 5, Status = "available" },
                    new Court { Id = Guid.NewGuid(), Name = "Sân 5", Zone = "Khu B", Type = "standard", PriceSlots = GetStandardSlots(), WeekendSurcharge = 10, HolidaySurcharge = 20, MemberDiscount = 5, Status = "available" },
                    new Court { Id = Guid.NewGuid(), Name = "Sân VIP", Zone = "Khu VIP", Type = "vip", PriceSlots = GetVipSlots(), WeekendSurcharge = 15, HolidaySurcharge = 30, MemberDiscount = 10, Status = "available" }
                );
                await db.SaveChangesAsync();
            }

            var courts = await db.Courts.ToListAsync();

            // 2. Customers
            if (!await db.Customers.AnyAsync())
            {
                var firstNames = new[] { "Nguyễn", "Trần", "Lê", "Phạm", "Đỗ", "Vũ", "Hoàng", "Bùi", "Đặng", "Hồ" };
                var middleNames = new[] { "Văn", "Thị", "Hoàng", "Minh", "Quốc", "Thu", "Anh", "Đức", "Thành", "Hải" };
                var lastNames = new[] { "An", "Bình", "Cường", "Dũng", "Em", "Phong", "Giang", "Hải", "Khánh", "Linh", "Mai", "Nga", "Oanh", "Tùng", "Quyên", "Tuấn", "Sơn", "Hà", "Phương", "Thảo" };
                
                var customers = new List<Customer>();
                for (int i = 0; i < 100; i++)
                {
                    var name = $"{firstNames[rng.Next(firstNames.Length)]} {middleNames[rng.Next(middleNames.Length)]} {lastNames[rng.Next(lastNames.Length)]}";
                    var phone = "09" + rng.Next(10000000, 99999999).ToString();
                    var loyalty = rng.Next(10, 5000);
                    var tags = new List<string>();
                    if (loyalty > 2000) tags.Add("vip");
                    if (rng.NextDouble() < 0.2) tags.Add("frequent");
                    if (rng.NextDouble() < 0.05) tags.Add("bad-debt");

                    customers.Add(new Customer
                    {
                        Id = Guid.NewGuid(),
                        Name = name,
                        Phone = phone,
                        Email = $"customer{i}@example.com",
                        Tags = tags,
                        LoyaltyPoints = loyalty,
                        Debt = tags.Contains("bad-debt") ? rng.Next(100, 1000) * 1000 : 0,
                        Locked = rng.NextDouble() < 0.02,
                        TotalBookings = rng.Next(1, 100),
                        JoinedAt = DateTime.UtcNow.AddDays(-rng.Next(1, 365)).ToString("yyyy-MM-dd")
                    });
                }
                db.Customers.AddRange(customers);
                await db.SaveChangesAsync();
            }

            var allCustomers = await db.Customers.ToListAsync();

            // 3. Products
            if (!await db.Products.AnyAsync())
            {
                var products = new List<Product>();
                var categories = new[] { "Nước suối", "Tăng lực", "Nước ngọt", "Bia", "Đồ ăn", "Bánh kẹo" };
                for (int i = 1; i <= 30; i++)
                {
                    products.Add(new Product
                    {
                        Id = Guid.NewGuid(),
                        Name = $"Sản phẩm {i}",
                        Category = categories[rng.Next(categories.Length)],
                        Price = rng.Next(10, 50) * 1000,
                        Stock = rng.Next(0, 200)
                    });
                }
                products[0].Name = "Nước suối Aquafina 500ml"; products[0].Price = 10000;
                products[1].Name = "Pocari Sweat"; products[1].Price = 18000;
                products[2].Name = "Coca-Cola lon"; products[2].Price = 15000;
                products[3].Name = "Mì ly Hảo Hảo"; products[3].Price = 15000;
                db.Products.AddRange(products);
                await db.SaveChangesAsync();
            }

            // 4. Supplies
            if (!await db.Supplies.AnyAsync())
            {
                var supplies = new List<Supply>();
                var supplyCats = new[] { "Cầu", "Cước", "Vợt", "Lưới", "Giày", "Phụ kiện" };
                for (int i = 1; i <= 20; i++)
                {
                    var isForSale = rng.NextDouble() < 0.7;
                    supplies.Add(new Supply
                    {
                        Id = Guid.NewGuid(),
                        Name = $"Vật tư {i}",
                        Category = supplyCats[rng.Next(supplyCats.Length)],
                        Quantity = rng.Next(5, 100),
                        Unit = "cái",
                        ReorderLevel = 10,
                        ForSale = isForSale,
                        SalePrice = isForSale ? rng.Next(20, 300) * 1000 : 0
                    });
                }
                supplies[0].Name = "Cầu lông Yonex AS-30"; supplies[0].SalePrice = 320000; supplies[0].ForSale = true;
                supplies[1].Name = "Vợt cho thuê Yonex"; supplies[1].ForSale = false;
                db.Supplies.AddRange(supplies);
                await db.SaveChangesAsync();
            }

            var allProducts = await db.Products.ToListAsync();
            var allSupplies = await db.Supplies.ToListAsync();

            // 5. Combos
            if (!await db.Combos.AnyAsync())
            {
                var combos = new List<Combo>();
                for (int i = 1; i <= 10; i++)
                {
                    var comboLines = new List<ComboLine>();
                    int lineCount = rng.Next(2, 5);
                    for (int j = 0; j < lineCount; j++)
                    {
                        var isProduct = rng.NextDouble() < 0.8;
                        if (isProduct)
                        {
                            var p = allProducts[rng.Next(allProducts.Count)];
                            comboLines.Add(new ComboLine { Id = Guid.NewGuid(), RefId = p.Id, Source = "product", Name = p.Name, Quantity = rng.Next(1, 3) });
                        }
                        else
                        {
                            var s = allSupplies.Where(x => x.ForSale).ToList();
                            if (s.Any())
                            {
                                var sel = s[rng.Next(s.Count)];
                                comboLines.Add(new ComboLine { Id = Guid.NewGuid(), RefId = sel.Id, Source = "supply", Name = sel.Name, Quantity = 1 });
                            }
                        }
                    }
                    combos.Add(new Combo
                    {
                        Id = Guid.NewGuid(),
                        Name = $"Combo Tiết Kiệm {i}",
                        Description = "Bao gồm nước uống và phụ kiện.",
                        Price = rng.Next(50, 200) * 1000,
                        Active = true,
                        Lines = comboLines
                    });
                }
                db.Combos.AddRange(combos);
                await db.SaveChangesAsync();
            }

            // 6. Employees
            if (!await db.Employees.AnyAsync())
            {
                var emps = new List<Employee>();
                var positions = new[] { "Quản lý", "Lễ tân", "Phục vụ", "Bảo vệ", "Tạp vụ" };
                for (int i = 1; i <= 20; i++)
                {
                    emps.Add(new Employee
                    {
                        Id = Guid.NewGuid(),
                        Name = $"Nhân viên {i}",
                        Position = positions[rng.Next(positions.Length)],
                        Phone = "09" + rng.Next(10000000, 99999999).ToString(),
                        Shift = "Ca Sáng",
                        Status = rng.NextDouble() < 0.9 ? "active" : "resigned",
                        JoinedAt = DateTime.UtcNow.AddDays(-rng.Next(30, 365)),
                        ShiftRate = rng.Next(20, 50) * 1000
                    });
                }
                db.Employees.AddRange(emps);
                await db.SaveChangesAsync();
            }

            var allEmployees = await db.Employees.ToListAsync();

            // 7. Promotions & Membership
            if (!await db.Promotions.AnyAsync())
            {
                var promos = new List<Promotion>();
                for (int i = 1; i <= 15; i++)
                {
                    promos.Add(new Promotion
                    {
                        Id = Guid.NewGuid(),
                        Code = $"PROMO{i}{rng.Next(100, 999)}",
                        Name = $"Khuyến mãi {i}",
                        Type = rng.NextDouble() < 0.5 ? "percentage" : "fixed",
                        Value = rng.NextDouble() < 0.5 ? rng.Next(5, 20) : rng.Next(20, 100) * 1000,
                        MaxUses = 1000,
                        UsedCount = rng.Next(0, 500)
                    });
                }
                db.Promotions.AddRange(promos);
                
                db.MembershipPlans.AddRange(
                    new MembershipPlan { Id = Guid.NewGuid(), Level = "basic", Name = "Thành viên Bạc", Price = 500000, DurationDays = 30, DiscountPercent = 5, Benefits = new List<string> { "Giảm 5% tiền sân" }, Active = true },
                    new MembershipPlan { Id = Guid.NewGuid(), Level = "silver", Name = "Thành viên Vàng", Price = 1200000, DurationDays = 90, DiscountPercent = 10, Benefits = new List<string> { "Giảm 10% tiền sân" }, Active = true },
                    new MembershipPlan { Id = Guid.NewGuid(), Level = "gold", Name = "Thành viên Kim Cương", Price = 4000000, DurationDays = 365, DiscountPercent = 15, Benefits = new List<string> { "Giảm 15% tiền sân" }, Active = true }
                );
                await db.SaveChangesAsync();
            }

            // 8. Bookings
            if (!await db.Bookings.AnyAsync())
            {
                var bookings = new List<Booking>();
                var bkCode = 1000;
                var startHours = new[] { 5, 6, 7, 8, 16, 17, 18, 19, 20, 21, 22 };
                
                // Past 60 days to Next 10 days
                for (int d = -60; d <= 10; d++)
                {
                    var date = DateTime.UtcNow.AddDays(d);
                    var dateIso = date.ToString("yyyy-MM-dd");
                    var isFuture = d > 0;
                    var count = rng.Next(10, 25); // 10-25 bookings per day
                    
                    for (int i = 0; i < count; i++)
                    {
                        var cust = allCustomers[rng.Next(allCustomers.Count)];
                        var court = courts[rng.Next(courts.Count)];
                        var startH = startHours[rng.Next(startHours.Length)];
                        var dur = 1 + rng.Next(2);
                        var endH = Math.Min(startH + dur, 24);
                        var hours = endH - startH;
                        
                        string status;
                        if (isFuture)
                        {
                            status = rng.NextDouble() < 0.2 ? "pending" : "confirmed";
                        }
                        else
                        {
                            status = rng.NextDouble() < 0.1 ? "cancelled" : "completed";
                        }

                        if (d == 0 && status == "completed")
                        {
                            status = "playing";
                        }

                        var pricePerHour = court.Type == "vip" ? 250000m : 120000m;

                        bookings.Add(new Booking
                        {
                            Id = Guid.NewGuid(),
                            Code = $"BK-{bkCode++}",
                            CustomerName = cust.Name,
                            CustomerPhone = cust.Phone,
                            CourtName = court.Name,
                            Date = dateIso,
                            StartTime = $"{startH:D2}:00",
                            EndTime = $"{endH:D2}:00",
                            Status = status,
                            TotalPrice = hours * pricePerHour,
                        });
                    }
                }
                db.Bookings.AddRange(bookings);
                await db.SaveChangesAsync();
            }

            var allBookings = await db.Bookings.ToListAsync();

            // 9. Orders & Payments
            if (!await db.Orders.AnyAsync())
            {
                var orders = new List<Order>();
                var payments = new List<Payment>();
                var odCode = 2000;
                var ptCode = 3000;

                // Create orders
                for (int d = -60; d <= 0; d++)
                {
                    var date = DateTime.UtcNow.AddDays(d).Date;
                    var count = rng.Next(5, 15);
                    for (int i = 0; i < count; i++)
                    {
                        var cust = allCustomers[rng.Next(allCustomers.Count)];
                        var hour = rng.Next(6, 22);
                        var createdAt = date.AddHours(hour).AddMinutes(rng.Next(60));
                        var lines = new List<OrderLine>();
                        var lineCount = rng.Next(1, 4);
                        for (int j = 0; j < lineCount; j++)
                        {
                            var p = allProducts[rng.Next(allProducts.Count)];
                            lines.Add(new OrderLine
                            {
                                RefId = p.Id.ToString(),
                                Source = "product",
                                Name = p.Name,
                                UnitPrice = p.Price,
                                Quantity = rng.Next(1, 5)
                            });
                        }
                        var total = lines.Sum(l => l.UnitPrice * l.Quantity);
                        var orderId = Guid.NewGuid();
                        var orderCode = $"HD-{odCode++}";

                        orders.Add(new Order
                        {
                            Id = orderId,
                            Code = orderCode,
                            CreatedAt = createdAt,
                            CustomerName = cust.Name,
                            CourtName = rng.NextDouble() < 0.5 ? courts[rng.Next(courts.Count)].Name : null,
                            Lines = lines,
                            Total = total
                        });

                        // Make a payment for this order
                        var methods = new[] { "cash", "qr", "ewallet", "card" };
                        payments.Add(new Payment
                        {
                            Id = Guid.NewGuid(),
                            Code = $"PT-{ptCode++}",
                            Source = "order",
                            RefId = orderId.ToString(),
                            RefCode = orderCode,
                            CustomerName = cust.Name,
                            Amount = total,
                            Method = methods[rng.Next(methods.Length)],
                            Status = "paid",
                            CreatedAt = createdAt,
                            PaidAt = createdAt
                        });
                    }
                }

                // Create payments for completed bookings
                foreach (var bk in allBookings.Where(b => b.Status == "completed"))
                {
                    var methods = new[] { "cash", "qr", "ewallet", "card" };
                    if (!DateTime.TryParse(bk.Date, out var dt)) dt = DateTime.UtcNow;
                    var hour = int.Parse(bk.EndTime.Split(':')[0]);
                    var createdAt = dt.Date.AddHours(hour);

                    payments.Add(new Payment
                    {
                        Id = Guid.NewGuid(),
                        Code = $"PT-{ptCode++}",
                        Source = "booking",
                        RefId = bk.Id.ToString(),
                        RefCode = bk.Code,
                        CustomerName = bk.CustomerName,
                        Amount = bk.TotalPrice,
                        Method = methods[rng.Next(methods.Length)],
                        Status = "paid",
                        CreatedAt = createdAt,
                        PaidAt = createdAt
                    });
                }

                db.Orders.AddRange(orders);
                db.Payments.AddRange(payments);
                await db.SaveChangesAsync();
            }

            // 10. Rentals & StockMovements
            if (!await db.Rentals.AnyAsync())
            {
                var rentals = new List<Rental>();
                var stockMovs = new List<StockMovement>();
                var rtCode = 4000;
                var rentalSupplies = allSupplies.Where(s => !s.ForSale).ToList();

                if (rentalSupplies.Any())
                {
                    for (int d = -60; d <= 0; d++)
                    {
                        var date = DateTime.UtcNow.AddDays(d).Date;
                        var count = rng.Next(2, 8);
                        for (int i = 0; i < count; i++)
                        {
                            var s = rentalSupplies[rng.Next(rentalSupplies.Count)];
                            var cust = allCustomers[rng.Next(allCustomers.Count)];
                            var hour = rng.Next(6, 20);
                            var borrowedAt = date.AddHours(hour);
                            var returnedAt = borrowedAt.AddHours(rng.Next(1, 3));
                            var isReturned = d < 0 || rng.NextDouble() < 0.5;

                            rentals.Add(new Rental
                            {
                                Id = Guid.NewGuid(),
                                Code = $"TH-{rtCode++}",
                                ItemId = s.Id,
                                ItemName = s.Name,
                                CustomerName = cust.Name,
                                CustomerPhone = cust.Phone,
                                Quantity = rng.Next(1, 3),
                                Fee = rng.Next(20, 100) * 1000,
                                Deposit = 100000,
                                BorrowedAt = borrowedAt,
                                DueAt = borrowedAt.AddHours(2),
                                ReturnedAt = isReturned ? returnedAt : null,
                                Status = isReturned ? "returned" : "borrowed"
                            });
                        }

                        // Also add some random stock movements for products
                        if (rng.NextDouble() < 0.5)
                        {
                            var p = allProducts[rng.Next(allProducts.Count)];
                            stockMovs.Add(new StockMovement
                            {
                                Id = Guid.NewGuid(),
                                CreatedAt = date.AddHours(12),
                                ItemSource = "product",
                                ItemId = p.Id,
                                ItemName = p.Name,
                                Type = "in",
                                Quantity = rng.Next(10, 50),
                                BalanceAfter = p.Stock + rng.Next(10, 50),
                                Reason = "Nhập kho định kỳ"
                            });
                        }
                    }
                }
                db.Rentals.AddRange(rentals);
                db.StockMovements.AddRange(stockMovs);
                await db.SaveChangesAsync();
            }

            // 11. Attendances, Assignments, CashierShifts
            if (!await db.Attendances.AnyAsync())
            {
                var attendances = new List<Attendance>();
                var assignments = new List<ShiftAssignment>();
                var cashierShifts = new List<CashierShift>();
                var shifts = new[] { "Ca Sáng", "Ca Chiều", "Ca Tối" };

                for (int d = -30; d <= 7; d++) // assignments up to 7 days future
                {
                    var date = DateTime.UtcNow.AddDays(d).Date;
                    
                    // Cashier shifts (only past & today)
                    if (d <= 0)
                    {
                        foreach (var shift in shifts)
                        {
                            if (rng.NextDouble() < 0.8)
                            {
                                cashierShifts.Add(new CashierShift
                                {
                                    Id = Guid.NewGuid(),
                                    Cashier = $"Thu Ngân {rng.Next(1, 5)}",
                                    OpenedAt = date.AddHours(shift == "Ca Sáng" ? 6 : shift == "Ca Chiều" ? 14 : 20),
                                    ClosedAt = d < 0 ? date.AddHours(shift == "Ca Sáng" ? 14 : shift == "Ca Chiều" ? 20 : 24) : null,
                                    OpeningCash = 1000000,
                                    CountedCash = d < 0 ? 1000000 + rng.Next(10, 100) * 10000 : null,
                                    Status = d < 0 ? "closed" : "open"
                                });
                            }
                        }
                    }

                    // Employee shifts
                    foreach (var emp in allEmployees)
                    {
                        if (rng.NextDouble() < 0.7) // 70% chance working
                        {
                            var shift = shifts[rng.Next(shifts.Length)];
                            assignments.Add(new ShiftAssignment
                            {
                                Id = Guid.NewGuid(),
                                EmployeeId = emp.Id,
                                EmployeeName = emp.Name,
                                Date = date,
                                Shift = shift
                            });

                            if (d <= 0) // Attendance for past/today
                            {
                                var status = rng.NextDouble() < 0.9 ? "present" : "absent";
                                TimeSpan? checkIn = null;
                                TimeSpan? checkOut = null;
                                if (status == "present")
                                {
                                    var startH = shift == "Ca Sáng" ? 6 : shift == "Ca Chiều" ? 14 : 20;
                                    checkIn = new TimeSpan(startH, rng.Next(0, 15), 0);
                                    checkOut = new TimeSpan(startH + 8, rng.Next(0, 30), 0);
                                }
                                attendances.Add(new Attendance
                                {
                                    Id = Guid.NewGuid(),
                                    EmployeeId = emp.Id,
                                    EmployeeName = emp.Name,
                                    Date = date,
                                    Shift = shift,
                                    Status = status,
                                    CheckIn = checkIn,
                                    CheckOut = checkOut
                                });
                            }
                        }
                    }
                }
                db.ShiftAssignments.AddRange(assignments);
                db.Attendances.AddRange(attendances);
                db.CashierShifts.AddRange(cashierShifts);
                await db.SaveChangesAsync();
            }

            // 12. AppNotifications
            if (!await db.AppNotifications.AnyAsync())
            {
                var notifs = new List<AppNotification>();
                var channels = new[] { "zalo", "sms", "email", "push" };
                for (int i = 0; i < 300; i++)
                {
                    var d = -rng.Next(0, 30);
                    var createdAt = DateTime.UtcNow.AddDays(d).AddHours(rng.Next(6, 22));
                    var isScheduled = d == 0 && rng.NextDouble() < 0.2;
                    notifs.Add(new AppNotification
                    {
                        Id = Guid.NewGuid(),
                        Channel = channels[rng.Next(channels.Length)],
                        Title = rng.NextDouble() < 0.5 ? "Nhắc lịch đặt sân" : "Chương trình khuyến mãi",
                        Message = "Nội dung thông báo tự động...",
                        Audience = rng.NextDouble() < 0.2 ? "Tất cả khách hàng" : allCustomers[rng.Next(allCustomers.Count)].Name,
                        Recipients = rng.Next(1, 100),
                        Status = isScheduled ? "scheduled" : rng.NextDouble() < 0.95 ? "sent" : "failed",
                        CreatedAt = createdAt.ToString("O"),
                        SentAt = isScheduled ? null : createdAt.AddMinutes(rng.Next(1, 5)).ToString("O")
                    });
                }
                db.AppNotifications.AddRange(notifs);
                await db.SaveChangesAsync();
            }
        }
    }
}
