-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 31, 2025 at 07:04 AM
-- Server version: 10.4.13-MariaDB
-- PHP Version: 7.2.31

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `crm_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `activities`
--

CREATE TABLE `activities` (
  `id` int(11) NOT NULL,
  `type` enum('call','email','meeting','task') DEFAULT 'task',
  `subject` varchar(255) NOT NULL,
  `dueDate` datetime DEFAULT NULL,
  `status` enum('todo','done') DEFAULT 'todo',
  `notes` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `CompanyId` int(11) DEFAULT NULL,
  `ContactId` int(11) DEFAULT NULL,
  `DealId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `activities`
--

INSERT INTO `activities` (`id`, `type`, `subject`, `dueDate`, `status`, `notes`, `createdAt`, `updatedAt`, `CompanyId`, `ContactId`, `DealId`, `userId`) VALUES
(1, 'call', 'Intro call with John', '2025-08-30 04:06:41', 'done', 'Went well', '2025-08-30 04:06:41', '2025-08-30 04:06:41', 1, 1, 1, 1),
(2, 'meeting', 'Kickoff with Globex', '2025-08-31 04:06:41', 'todo', 'Prepare slides', '2025-08-30 04:06:41', '2025-08-30 04:06:41', 2, 2, 2, 1),
(3, 'task', 'www', '2025-08-31 00:00:00', 'todo', NULL, '2025-08-30 06:36:09', '2025-08-30 06:36:09', 1, 1, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `domain` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `ownerId` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `name`, `domain`, `phone`, `city`, `country`, `ownerId`, `createdAt`, `updatedAt`) VALUES
(1, 'Acme Corp', 'acme.com', NULL, 'Riyadh', 'SA', 1, '2025-08-30 04:06:41', '2025-08-30 04:06:41'),
(2, 'Globex LLC', 'globex.com', NULL, 'Bangalore', 'IN', 1, '2025-08-30 04:06:41', '2025-08-30 04:06:41'),
(4, 'FedHub Software', 'http://fedhubsoftware.com', '9585175461', 'dharmapuri', 'india', NULL, '2025-08-30 08:46:28', '2025-08-30 08:46:28');

-- --------------------------------------------------------

--
-- Table structure for table `contacts`
--

CREATE TABLE `contacts` (
  `id` int(11) NOT NULL,
  `firstName` varchar(255) NOT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `CompanyId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `contacts`
--

INSERT INTO `contacts` (`id`, `firstName`, `lastName`, `email`, `phone`, `createdAt`, `updatedAt`, `CompanyId`) VALUES
(1, 'John', 'Doe', 'john@acme.com', '555-1000', '2025-08-30 04:06:41', '2025-08-30 04:06:41', 1),
(2, 'Jane', 'Smith', 'jane@globex.com', '555-2000', '2025-08-30 04:06:41', '2025-08-30 04:06:41', 2),
(5, 'balaji', 'rajendran', 'balag.developer@gmail.com', '232323', '2025-08-30 04:36:19', '2025-08-30 04:36:19', 1),
(7, 'balaji', 'r', 'k.gayathri9694@gmail.com', '9585175461', '2025-08-30 06:50:25', '2025-08-30 06:50:25', 1);

-- --------------------------------------------------------

--
-- Table structure for table `deals`
--

CREATE TABLE `deals` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `amount` float DEFAULT 0,
  `stage` enum('new','qualified','proposal','won','lost') DEFAULT 'new',
  `ownerId` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `CompanyId` int(11) DEFAULT NULL,
  `ContactId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `deals`
--

INSERT INTO `deals` (`id`, `title`, `amount`, `stage`, `ownerId`, `createdAt`, `updatedAt`, `CompanyId`, `ContactId`) VALUES
(1, 'Website Revamp', 12000, 'won', 1, '2025-08-30 04:06:41', '2025-08-30 06:13:47', 1, 1),
(2, 'Cloud Migration', 45000, 'qualified', 1, '2025-08-30 04:06:41', '2025-08-30 08:23:55', 2, 2),
(3, '122', 229, 'new', NULL, '2025-08-30 08:23:39', '2025-08-30 15:57:17', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `grnitems`
--

CREATE TABLE `grnitems` (
  `id` int(11) NOT NULL,
  `GRNId` int(11) NOT NULL,
  `PurchaseOrderItemId` int(11) NOT NULL,
  `product` varchar(120) NOT NULL,
  `qtyOrdered` int(11) NOT NULL,
  `qtyReceived` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `grnitems`
--

INSERT INTO `grnitems` (`id`, `GRNId`, `PurchaseOrderItemId`, `product`, `qtyOrdered`, `qtyReceived`, `createdAt`, `updatedAt`) VALUES
(1, 1, 1, 'sdsd', 1, 1, '2025-08-30 19:36:34', '2025-08-30 19:36:34'),
(2, 1, 2, '232', 1, 1, '2025-08-30 19:36:34', '2025-08-30 19:36:34'),
(3, 2, 11, 'sw', 45, 3, '2025-08-31 04:46:55', '2025-08-31 04:46:55');

-- --------------------------------------------------------

--
-- Table structure for table `grns`
--

CREATE TABLE `grns` (
  `id` int(11) NOT NULL,
  `number` varchar(32) NOT NULL,
  `PurchaseOrderId` int(11) NOT NULL,
  `receivedDate` date DEFAULT NULL,
  `status` enum('draft','approved','cancelled') NOT NULL DEFAULT 'draft',
  `notes` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `grns`
--

INSERT INTO `grns` (`id`, `number`, `PurchaseOrderId`, `receivedDate`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES
(1, 'GRN-2025-00001', 2, '2025-08-30', 'approved', NULL, '2025-08-30 19:36:34', '2025-08-30 19:36:34'),
(2, 'GRN-2025-00002', 4, '2025-08-31', 'approved', NULL, '2025-08-31 04:46:55', '2025-08-31 04:46:55');

-- --------------------------------------------------------

--
-- Table structure for table `invoiceitems`
--

CREATE TABLE `invoiceitems` (
  `id` int(11) NOT NULL,
  `InvoiceId` int(11) NOT NULL,
  `description` varchar(200) NOT NULL,
  `qty` int(11) NOT NULL DEFAULT 1,
  `price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `invoiceitems`
--

INSERT INTO `invoiceitems` (`id`, `InvoiceId`, `description`, `qty`, `price`, `createdAt`, `updatedAt`) VALUES
(1, 1, 'dfgd', 1, '34.00', '2025-08-30 18:44:43', '2025-08-30 18:44:43');

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` int(11) NOT NULL,
  `number` varchar(32) NOT NULL,
  `customer` varchar(120) NOT NULL,
  `invoiceDate` date DEFAULT NULL,
  `dueDate` date DEFAULT NULL,
  `status` enum('draft','sent','paid','void') NOT NULL DEFAULT 'draft',
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `tax` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `CompanyId` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`id`, `number`, `customer`, `invoiceDate`, `dueDate`, `status`, `subtotal`, `tax`, `total`, `CompanyId`, `createdAt`, `updatedAt`) VALUES
(1, 'INV-2025-00001', 'erre', '2025-08-06', '2025-09-02', 'draft', '0.00', '0.00', '0.00', NULL, '2025-08-30 18:44:43', '2025-08-30 18:44:43');

-- --------------------------------------------------------

--
-- Table structure for table `purchaseorderitems`
--

CREATE TABLE `purchaseorderitems` (
  `id` int(11) NOT NULL,
  `PurchaseOrderId` int(11) NOT NULL,
  `product` varchar(120) NOT NULL,
  `qty` int(11) NOT NULL DEFAULT 1,
  `price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `purchaseorderitems`
--

INSERT INTO `purchaseorderitems` (`id`, `PurchaseOrderId`, `product`, `qty`, `price`, `createdAt`, `updatedAt`) VALUES
(1, 2, 'sdsd', 1, '232.00', '2025-08-30 09:22:50', '2025-08-30 09:22:50'),
(2, 2, '232', 1, '34.00', '2025-08-30 09:22:50', '2025-08-30 09:22:50'),
(3, 3, 'One', 1, '0.00', '2025-08-30 09:58:04', '2025-08-30 09:58:04'),
(6, 6, 'w', 1, '0.00', '2025-08-30 17:43:05', '2025-08-30 17:43:05'),
(9, 7, 'qqqqqq33', 1, '0.00', '2025-08-30 17:51:29', '2025-08-30 17:51:29'),
(10, 7, 'dddsss', 1, '0.00', '2025-08-30 17:51:29', '2025-08-30 17:51:29'),
(11, 4, 'sw', 45, '34.00', '2025-08-31 04:46:20', '2025-08-31 04:46:20');

-- --------------------------------------------------------

--
-- Table structure for table `purchaseorders`
--

CREATE TABLE `purchaseorders` (
  `id` int(11) NOT NULL,
  `number` varchar(32) NOT NULL,
  `vendor` varchar(120) NOT NULL,
  `orderDate` date DEFAULT NULL,
  `status` enum('draft','approved','received','cancelled') NOT NULL DEFAULT 'draft',
  `total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `CompanyId` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `purchaseorders`
--

INSERT INTO `purchaseorders` (`id`, `number`, `vendor`, `orderDate`, `status`, `total`, `CompanyId`, `createdAt`, `updatedAt`) VALUES
(2, 'PO-2025-00001', 'fedhub', '0000-00-00', 'received', '232.00', 1, '2025-08-30 09:22:18', '2025-08-30 09:25:35'),
(3, 'PO-2025-00003', 'fedhub2', '2025-08-14', 'received', '0.00', 2, '2025-08-30 09:57:21', '2025-08-30 19:16:54'),
(4, 'PO-2025-00004', 'fedhub', '2025-08-06', 'received', '0.00', 1, '2025-08-30 15:59:26', '2025-08-31 04:46:20'),
(5, 'PO-2025-00005', 'drter', NULL, 'approved', '0.00', 2, '2025-08-30 17:41:10', '2025-08-31 04:48:25'),
(6, 'PO-2025-00006', 'sfd', NULL, 'draft', '0.00', 2, '2025-08-30 17:42:52', '2025-08-30 17:43:05'),
(7, 'PO-2025-00007', '7e5', NULL, 'draft', '0.00', 2, '2025-08-30 17:50:55', '2025-08-30 17:51:29');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `role` enum('admin','manager','sales','agent','viewer') NOT NULL DEFAULT 'viewer',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `passwordHash`, `role`, `createdAt`, `updatedAt`) VALUES
(1, 'Admin', 'admin@example.com', '$2b$10$6PJZZVnUgSZgajuI54VMjudcC2xarP52CP6XgGav8j21bNplSsVLS', 'admin', '2025-08-30 04:06:41', '2025-08-30 04:06:41'),
(2, 'balaji', 'balaji@example.com', '$2a$10$CkBWkMESgrKhZl5RnQVUcOPhFs49fYgiLZ/KX.idWJJyi/lEyZv/6', 'viewer', '2025-08-30 07:33:14', '2025-08-30 07:33:14'),
(3, 'Aravin', 'aravind@example.com', '$2a$10$ui0rn8SqH4ONeuZ8EferY.JlohuoeNBpG.4BYMNjaO5IafHf3Nl/q', 'viewer', '2025-08-30 16:09:37', '2025-08-30 16:09:37');

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_poitem_received`
-- (See below for the actual view)
--
CREATE TABLE `v_poitem_received` (
`PurchaseOrderItemId` int(11)
,`qtyReceived` decimal(32,0)
);

-- --------------------------------------------------------

--
-- Structure for view `v_poitem_received`
--
DROP TABLE IF EXISTS `v_poitem_received`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_poitem_received`  AS  select `poi`.`id` AS `PurchaseOrderItemId`,coalesce(sum(`gri`.`qtyReceived`),0) AS `qtyReceived` from (`purchaseorderitems` `poi` left join `grnitems` `gri` on(`gri`.`PurchaseOrderItemId` = `poi`.`id`)) group by `poi`.`id` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activities`
--
ALTER TABLE `activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `CompanyId` (`CompanyId`),
  ADD KEY `ContactId` (`ContactId`),
  ADD KEY `DealId` (`DealId`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ownerId` (`ownerId`);

--
-- Indexes for table `contacts`
--
ALTER TABLE `contacts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `CompanyId` (`CompanyId`);

--
-- Indexes for table `deals`
--
ALTER TABLE `deals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ownerId` (`ownerId`),
  ADD KEY `CompanyId` (`CompanyId`),
  ADD KEY `ContactId` (`ContactId`);

--
-- Indexes for table `grnitems`
--
ALTER TABLE `grnitems`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_grn_item_grn` (`GRNId`),
  ADD KEY `fk_grn_item_poi` (`PurchaseOrderItemId`);

--
-- Indexes for table `grns`
--
ALTER TABLE `grns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_grn_po` (`PurchaseOrderId`);

--
-- Indexes for table `invoiceitems`
--
ALTER TABLE `invoiceitems`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_invoice` (`InvoiceId`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `purchaseorderitems`
--
ALTER TABLE `purchaseorderitems`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_po` (`PurchaseOrderId`);

--
-- Indexes for table `purchaseorders`
--
ALTER TABLE `purchaseorders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activities`
--
ALTER TABLE `activities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `contacts`
--
ALTER TABLE `contacts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `deals`
--
ALTER TABLE `deals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `grnitems`
--
ALTER TABLE `grnitems`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `grns`
--
ALTER TABLE `grns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `invoiceitems`
--
ALTER TABLE `invoiceitems`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `purchaseorderitems`
--
ALTER TABLE `purchaseorderitems`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `purchaseorders`
--
ALTER TABLE `purchaseorders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activities`
--
ALTER TABLE `activities`
  ADD CONSTRAINT `activities_ibfk_1` FOREIGN KEY (`CompanyId`) REFERENCES `companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `activities_ibfk_2` FOREIGN KEY (`ContactId`) REFERENCES `contacts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `activities_ibfk_3` FOREIGN KEY (`DealId`) REFERENCES `deals` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `activities_ibfk_4` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `companies`
--
ALTER TABLE `companies`
  ADD CONSTRAINT `companies_ibfk_1` FOREIGN KEY (`ownerId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `contacts`
--
ALTER TABLE `contacts`
  ADD CONSTRAINT `contacts_ibfk_1` FOREIGN KEY (`CompanyId`) REFERENCES `companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `deals`
--
ALTER TABLE `deals`
  ADD CONSTRAINT `deals_ibfk_1` FOREIGN KEY (`ownerId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `deals_ibfk_2` FOREIGN KEY (`CompanyId`) REFERENCES `companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `deals_ibfk_3` FOREIGN KEY (`ContactId`) REFERENCES `contacts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `grnitems`
--
ALTER TABLE `grnitems`
  ADD CONSTRAINT `fk_grn_item_grn` FOREIGN KEY (`GRNId`) REFERENCES `grns` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_grn_item_poi` FOREIGN KEY (`PurchaseOrderItemId`) REFERENCES `purchaseorderitems` (`id`);

--
-- Constraints for table `grns`
--
ALTER TABLE `grns`
  ADD CONSTRAINT `fk_grn_po` FOREIGN KEY (`PurchaseOrderId`) REFERENCES `purchaseorders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `invoiceitems`
--
ALTER TABLE `invoiceitems`
  ADD CONSTRAINT `fk_invoice` FOREIGN KEY (`InvoiceId`) REFERENCES `invoices` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `purchaseorderitems`
--
ALTER TABLE `purchaseorderitems`
  ADD CONSTRAINT `fk_po` FOREIGN KEY (`PurchaseOrderId`) REFERENCES `purchaseorders` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
