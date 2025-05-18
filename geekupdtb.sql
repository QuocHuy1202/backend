CREATE DATABASE ECOMERCEWEBSITE
GO

USE ECOMERCEWEBSITE
GO

CREATE TABLE Users (
    user_id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    province VARCHAR(100),
    district VARCHAR(100),
    commune VARCHAR(100),
    address TEXT,
    housing_type VARCHAR(50)
)

CREATE TABLE Categories (
    category_id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(100)
)

CREATE TABLE Stores (
    store_id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(100),
    location TEXT
)

CREATE TABLE Products (
    product_id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(255),
    price INT,
    category_id INT,
    store_id INT,
	be_liked INT,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id),
    FOREIGN KEY (store_id) REFERENCES Stores(store_id)
)

CREATE TABLE ProductDetails (
    variant_id INT PRIMARY KEY IDENTITY(1,1),
    product_id INT,
    size VARCHAR(10),
	model varchar(20),
	brand varchar(20),
	_type varchar(10),
    color VARCHAR(50),
    quantity INT,
    description TEXT,
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
)

CREATE TABLE Vouchers (
    voucher_id INT PRIMARY KEY IDENTITY(1,1),
    code VARCHAR(50),
    discount_percent DECIMAL(5,2),
    expiry_date DATE
)

CREATE TABLE UserVouchers (
    user_id INT,
    voucher_id INT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (voucher_id) REFERENCES Vouchers(voucher_id),
    PRIMARY KEY (user_id, voucher_id)
)

CREATE TABLE Orders (
    order_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT,
    order_date DATETIME,
    total_price INT,
    status VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
)

CREATE TABLE OrderItems (
    order_id INT,
    product_id INT,
    variant_id INT,
    quantity INT,
    price_each INT,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id),
    FOREIGN KEY (variant_id) REFERENCES ProductDetails(variant_id),
    PRIMARY KEY (order_id, variant_id)
)

-- Câu b
INSERT INTO Users (name, email, phone, province, district, commune, address, housing_type)
VALUES (
    N'assessment',
    'gu@gmail.com',
    '328355333',
    N'Bắc Kạn',
    N'Ba Bể',
    N'Phúc Lộc',
    N'73 tân hoà 2',
    N'nhà riêng'
);

INSERT INTO Categories (name)
VALUES (N'Giày');  


INSERT INTO Stores (name, location)
VALUES (N'Cửa hàng Kappa', N'Hà Nội');  

INSERT INTO Products (name, price, category_id, store_id, be_liked)
VALUES (
    N'KAPPA Women''s Sneakers',
    980000,
    1,  
    1,  
    0   
);

INSERT INTO ProductDetails (product_id, size, model, brand, _type, color, quantity, description)
VALUES (
    1,         
    '36',
    NULL,      
    'KAPPA',
    'Sneaker',
    'yellow',
    5,
    N'Sản phẩm giày nữ thời trang màu vàng size 36'
);



DECLARE @user_id INT = (SELECT user_id FROM Users WHERE email = 'gu@gmail.com');
DECLARE @variant_id INT = (
    SELECT variant_id FROM ProductDetails
    WHERE size = '36' AND color = 'yellow'
      AND product_id IN (SELECT product_id FROM Products WHERE name = N'KAPPA Women''s Sneakers')
);
DECLARE @price INT = (
    SELECT price FROM Products
    WHERE product_id = (SELECT product_id FROM ProductDetails WHERE variant_id = @variant_id)
);
DECLARE @quantity_needed INT = 1;
DECLARE @stock_quantity INT = (
    SELECT quantity FROM ProductDetails WHERE variant_id = @variant_id
);


IF @stock_quantity >= @quantity_needed
BEGIN
   
    UPDATE ProductDetails
    SET quantity = quantity - @quantity_needed
    WHERE variant_id = @variant_id;

    
    INSERT INTO Orders (user_id, order_date, total_price, status)
    VALUES (@user_id, GETDATE(), @price * @quantity_needed, N'Đã đặt hàng');

    DECLARE @order_id INT = SCOPE_IDENTITY();

    
    INSERT INTO OrderItems (order_id, variant_id, quantity, price_each)
    VALUES (@order_id, @variant_id, @quantity_needed, @price);
END
ELSE
BEGIN
    
    RAISERROR(N'Sản phẩm không đủ số lượng tồn kho.', 16, 1);
END

-- câu c
SELECT 
    MONTH(order_date) AS Month,
    AVG(total_price) AS AverageOrderValue
FROM Orders
WHERE YEAR(order_date) = YEAR(GETDATE())
GROUP BY MONTH(order_date)
ORDER BY Month;



--câu d
WITH CustomersInEarlierPeriod AS (
    SELECT DISTINCT user_id
    FROM Orders
    WHERE order_date >= DATEADD(MONTH, -12, GETDATE())
      AND order_date < DATEADD(MONTH, -6, GETDATE())
),
CustomersInRecentPeriod AS (
    SELECT DISTINCT user_id
    FROM Orders
    WHERE order_date >= DATEADD(MONTH, -6, GETDATE())
)

SELECT 
    CAST(
        100.0 * COUNT(DISTINCT c.user_id) / NULLIF((SELECT COUNT(*) FROM CustomersInEarlierPeriod), 0)
    AS DECIMAL(5,2)) AS ChurnRatePercent
FROM CustomersInEarlierPeriod c
LEFT JOIN CustomersInRecentPeriod r
    ON c.user_id = r.user_id
WHERE r.user_id IS NULL;

