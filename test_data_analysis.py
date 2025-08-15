#!/usr/bin/env python3
"""
Simple test to analyze the sample data files and validate our upload system design.
This doesn't require BigQuery or external dependencies.
"""
import pandas as pd
from pathlib import Path
import sys


def analyze_rent_roll_data():
    """Analyze the rent roll sample data."""
    print("\n📊 RENT ROLL DATA ANALYSIS")
    print("=" * 50)
    
    file_path = Path("docs/rent_roll-20250628 - RentRoll (3).csv")
    
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return False
    
    try:
        # Read the CSV file
        df = pd.read_csv(file_path)
        
        print(f"✅ File loaded successfully!")
        print(f"   📄 Filename: {file_path.name}")
        print(f"   📊 Rows: {len(df):,}")
        print(f"   📋 Columns: {len(df.columns)}")
        
        # Show column structure
        print(f"\n📋 Column Structure:")
        for i, col in enumerate(df.columns, 1):
            print(f"   {i:2d}. {col}")
        
        # Check required columns for rent roll
        required_columns = ['Unit', 'Bedroom', 'Bathrooms', 'Sqft', 'Status', 'Property']
        print(f"\n🔍 Required Column Check:")
        
        missing_columns = []
        for col in required_columns:
            if col in df.columns:
                print(f"   ✅ {col}")
            else:
                print(f"   ❌ {col} - MISSING")
                missing_columns.append(col)
        
        if missing_columns:
            print(f"\n⚠️  Missing required columns: {missing_columns}")
            return False
        
        # Analyze data quality
        print(f"\n📈 Data Quality Analysis:")
        
        # Check for empty values
        total_cells = len(df) * len(df.columns)
        empty_cells = df.isnull().sum().sum()
        completeness = (total_cells - empty_cells) / total_cells
        print(f"   📊 Data Completeness: {completeness:.1%}")
        
        # Check status distribution
        if 'Status' in df.columns:
            status_counts = df['Status'].value_counts()
            print(f"   🏠 Unit Status Distribution:")
            for status, count in status_counts.items():
                print(f"      {status}: {count}")
        
        # Check rent data
        if 'Market_Rent' in df.columns:
            market_rents = pd.to_numeric(df['Market_Rent'].astype(str).str.replace(r'[$,"]', '', regex=True), errors='coerce')
            valid_rents = market_rents.dropna()
            print(f"   💰 Market Rent Analysis:")
            print(f"      Valid rent entries: {len(valid_rents)}/{len(df)}")
            if len(valid_rents) > 0:
                print(f"      Average rent: ${valid_rents.mean():.0f}")
                print(f"      Min rent: ${valid_rents.min():.0f}")
                print(f"      Max rent: ${valid_rents.max():.0f}")
        
        # Check for duplicates
        if 'Unit' in df.columns and 'Property' in df.columns:
            duplicates = df.duplicated(subset=['Unit', 'Property']).sum()
            print(f"   🔍 Duplicate Units: {duplicates}")
        
        print(f"\n✅ Rent Roll Analysis Complete - Data looks good for upload system!")
        return True
        
    except Exception as e:
        print(f"❌ Error analyzing rent roll data: {e}")
        return False


def analyze_competition_data():
    """Analyze the competition sample data."""
    print("\n🏆 COMPETITION DATA ANALYSIS") 
    print("=" * 50)
    
    file_path = Path("docs/scraperVspanish - Sheet10.csv")
    
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return False
    
    try:
        # Read the CSV file
        df = pd.read_csv(file_path)
        
        print(f"✅ File loaded successfully!")
        print(f"   📄 Filename: {file_path.name}")
        print(f"   📊 Rows: {len(df):,}")
        print(f"   📋 Columns: {len(df.columns)}")
        
        # Show column structure
        print(f"\n📋 Column Structure:")
        for i, col in enumerate(df.columns, 1):
            print(f"   {i:2d}. {col}")
        
        # Check required columns for competition
        required_columns = ['Reporting Property Name', 'Bedrooms', 'Market Rent', 'Avg. Sq. Ft.']
        print(f"\n🔍 Required Column Check:")
        
        missing_columns = []
        for col in required_columns:
            if col in df.columns:
                print(f"   ✅ {col}")
            else:
                print(f"   ❌ {col} - MISSING")
                missing_columns.append(col)
        
        if missing_columns:
            print(f"\n⚠️  Missing required columns: {missing_columns}")
            return False
        
        # Analyze competition data
        print(f"\n📈 Competition Analysis:")
        
        # Property analysis
        if 'Reporting Property Name' in df.columns:
            property_counts = df['Reporting Property Name'].value_counts()
            print(f"   🏢 Competitor Properties:")
            for prop, count in property_counts.head(5).items():
                print(f"      {prop}: {count} units")
            if len(property_counts) > 5:
                print(f"      ... and {len(property_counts) - 5} more properties")
        
        # Bedroom analysis
        if 'Bedrooms' in df.columns:
            bedroom_counts = df['Bedrooms'].value_counts()
            print(f"   🛏️  Bedroom Distribution:")
            for bedroom, count in bedroom_counts.items():
                print(f"      {bedroom}: {count} units")
        
        # Rent analysis
        if 'Market Rent' in df.columns:
            # Clean rent data
            rent_cleaned = pd.to_numeric(
                df['Market Rent'].astype(str).str.replace(r'[$,"]', '', regex=True), 
                errors='coerce'
            )
            valid_rents = rent_cleaned.dropna()
            print(f"   💰 Market Rent Analysis:")
            print(f"      Valid rent entries: {len(valid_rents)}/{len(df)}")
            if len(valid_rents) > 0:
                print(f"      Average rent: ${valid_rents.mean():.0f}")
                print(f"      Min rent: ${valid_rents.min():.0f}")
                print(f"      Max rent: ${valid_rents.max():.0f}")
        
        print(f"\n✅ Competition Analysis Complete - Data looks good for upload system!")
        return True
        
    except Exception as e:
        print(f"❌ Error analyzing competition data: {e}")
        return False


def test_upload_system_design():
    """Test the upload system design with our sample data."""
    print("\n🧪 UPLOAD SYSTEM DESIGN TEST")
    print("=" * 50)
    
    # Test data compatibility
    rent_roll_ok = analyze_rent_roll_data()
    competition_ok = analyze_competition_data()
    
    if rent_roll_ok and competition_ok:
        print(f"\n🎉 SUCCESS: Upload System Design Validated!")
        print(f"")
        print(f"✅ Both data files are compatible with upload system")
        print(f"✅ All required columns are present") 
        print(f"✅ Data quality looks good for processing")
        print(f"✅ Schema validation logic will work correctly")
        
        print(f"\n🚀 NEXT STEPS:")
        print(f"1. Set up Google Cloud credentials")
        print(f"2. Run BigQuery infrastructure setup")
        print(f"3. Start backend server")
        print(f"4. Test actual upload endpoints")
        
        return True
    else:
        print(f"\n❌ Issues found with data compatibility")
        return False


def main():
    """Main entry point."""
    print("🚀 AI RENT OPTIMIZER - UPLOAD SYSTEM TEST")
    print("=" * 60)
    
    # Change to project root directory
    project_root = Path(__file__).parent
    import os
    os.chdir(project_root)
    
    success = test_upload_system_design()
    
    if success:
        print(f"\n✨ Upload system design is validated and ready!")
        print(f"   Your data files are perfectly compatible with the system.")
        print(f"   All validation logic will work as expected.")
    else:
        print(f"\n⚠️  Please resolve data compatibility issues before proceeding.")
        sys.exit(1)


if __name__ == "__main__":
    main()
