# 📋 Manufacturer Catalog CSV Upload Format Guide

## 🎯 Overview
This document specifies the exact format required for uploading manufacturer catalog data via CSV or Excel files.

## 📊 Required & Optional Fields

### ✅ **MANDATORY FIELDS**
| Field Name | CSV Column Names (Case Insensitive) | Data Type | Description | Example |
|------------|-------------------------------------|-----------|-------------|---------|
| **Code** | `Code`, `Item`, `CODE`, `ITEM` | String | Item/Product code (Primary identifier) | `BM-W321`, `30GR`, `D406` |

### 🔧 **OPTIONAL FIELDS**
| Field Name | CSV Column Names (Case Insensitive) | Data Type | Description | Example |
|------------|-------------------------------------|-----------|-------------|---------|
| **Description** | `Description`, `DESCRIPTION` | Text | Product description | `Base cabinet with doors`, `Glass rack` |
| **Style** | `Style`, `STYLE` | String | Style/finish name | `Shaker White`, `Traditional Oak` |
| **Price** | `Price`, `PRICE` | Decimal | Unit price (numeric only) | `125.50`, `89.99` |
| **Type** | `Type`, `TYPE` | String | Product category | `Base Cabinet`, `Wall Cabinet`, `Accessories` |
| **Color** | `Color`, `COLOR` | String | Color specification | `White`, `Espresso`, `Natural` |
| **Discontinued** | `Discontinued` | Boolean | Product status | `yes`/`no`, `1`/`0`, `true`/`false` |

## 📝 **Sample CSV Format**

### **Minimal Required Format:**
```csv
Code
BM-W321
30GR
D406
```

### **Complete Format Example:**
```csv
Code,Description,Style,Price,Type,Color,Discontinued
BM-W321,Base cabinet with doors,Shaker White,125.50,Base Cabinet,White,no
30GR,Glass rack,Traditional,55.03,Accessories,,no
D406,Wall cabinet 30 inch,Shaker White,89.99,Wall Cabinet,White,no
FA2421,Vanity sink base,Modern,274.36,Vanity,Espresso,yes
```

### **Alternative Column Names (All Supported):**
```csv
ITEM,DESCRIPTION,STYLE,PRICE,TYPE,COLOR,Discontinued
BM-W321,Base cabinet with doors,Shaker White,125.50,Base Cabinet,White,no
```

## 🔍 **Field Specifications**

### **Code Field (MANDATORY)**
- **Purpose**: Primary identifier for each product
- **Format**: Any alphanumeric string
- **Examples**: `BM-W321`, `30GR`, `D406`, `FA2421`
- **Notes**: Must be unique within the manufacturer catalog

### **Description Field (Optional)**
- **Purpose**: Detailed product description
- **Format**: Free text (up to TEXT limit)
- **Examples**: `Base cabinet with doors`, `Glass rack`, `Vanity sink base`

### **Style Field (Optional)**
- **Purpose**: Style/finish specification
- **Format**: String
- **Examples**: `Shaker White`, `Traditional Oak`, `Modern Espresso`

### **Price Field (Optional)**
- **Purpose**: Unit price
- **Format**: Decimal number (10,2)
- **Examples**: `125.50`, `89.99`, `274.36`
- **Notes**: Currency symbols not allowed, numbers only

### **Type Field (Optional)**
- **Purpose**: Product category/classification
- **Format**: String
- **Examples**: `Base Cabinet`, `Wall Cabinet`, `Accessories`, `Vanity`

### **Color Field (Optional)**
- **Purpose**: Color specification
- **Format**: String
- **Examples**: `White`, `Espresso`, `Natural`, `Cherry`

### **Discontinued Field (Optional)**
- **Purpose**: Product availability status
- **Format**: Boolean
- **Accepted Values**: 
  - `yes`, `no`
  - `true`, `false`
  - `1`, `0`
- **Default**: `false` (active product)

## 📎 **Supported File Formats**

| Format | MIME Type | Extensions |
|--------|-----------|------------|
| CSV | `text/csv` | `.csv` |
| Excel (Legacy) | `application/vnd.ms-excel` | `.xls` |
| Excel (Modern) | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | `.xlsx` |

## ⚠️ **Important Notes**

### **Header Row Requirements**
- First row must contain column headers
- Column names are **case-insensitive**
- Multiple variations supported (see table above)

### **Data Validation**
- Empty Code fields will skip the entire row
- Numeric fields (Price) will default to 0.0 if invalid
- Boolean fields default to false if unrecognized
- Duplicate codes will update existing records

### **Special Characters**
- The system automatically cleans special HTML entities
- `+AC0-` sequences are converted to `-` (dash)

### **Upload Behavior**
- **New Records**: Creates new catalog entries
- **Existing Records**: Updates all fields except code and manufacturer
- **File History**: Tracks all uploaded files with metadata

## 🚀 **Upload Process**

1. Navigate to **Settings → Manufacturers → [Select Manufacturer] → Catalog Mapping**
2. Click **"Upload File"** button
3. Select your CSV/Excel file
4. File will be processed automatically
5. View imported data in the catalog table

## ✅ **Validation Examples**

### **Valid CSV Example:**
```csv
Code,Description,Style,Price,Type
BM-W321,Base cabinet with doors,Shaker White,125.50,Base Cabinet
30GR,Glass rack,Traditional,55.03,Accessories
D406,Wall cabinet,Shaker White,89.99,Wall Cabinet
```

### **Common Issues to Avoid:**
❌ **Missing Code Column**
```csv
Description,Price
Base cabinet,125.50  # Invalid - no Code column
```

❌ **Empty Code Values**
```csv
Code,Description,Price
,Base cabinet,125.50  # Invalid - empty code
BM-W321,Wall cabinet,89.99  # Valid
```

❌ **Invalid Price Format**
```csv
Code,Price
BM-W321,$125.50  # Invalid - contains currency symbol
30GR,125.50      # Valid - numeric only
```

## 📞 **Support**

If you encounter issues with CSV uploads:
1. Verify your file follows the format above
2. Check that the Code column exists and has values
3. Ensure numeric fields contain only numbers
4. Try with a minimal CSV (just Code column) first

**File Size Limits**: Up to 50MB per file
**Row Limits**: No specific limit, but large files may take longer to process
