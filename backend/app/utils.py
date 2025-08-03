"""
Utility functions for the RentRoll AI Optimizer backend.
"""
import json
import math
import numpy as np
import pandas as pd
from datetime import datetime, date
from typing import Any

class CustomJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle pandas/numpy data types, datetime, and NaN values."""
    
    def default(self, obj: Any) -> Any:
        # Handle datetime objects
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        
        # Handle pandas/numpy datetime types
        if isinstance(obj, (pd.Timestamp, np.datetime64)):
            return pd.to_datetime(obj).isoformat()
        
        # Handle NaN values (convert to null)
        if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
            return None
        
        # Handle numpy NaN
        if isinstance(obj, (np.floating, np.integer)):
            if np.isnan(obj) or np.isinf(obj):
                return None
            return float(obj)
        
        # Handle pandas NA/NaT
        if pd.isna(obj):
            return None
        
        # Handle numpy arrays
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        
        # Handle pandas Series
        if isinstance(obj, pd.Series):
            return obj.tolist()
        
        # Handle numpy data types
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.bool_):
            return bool(obj)
        
        # Let the base class handle other types
        return super().default(obj)


def serialize_for_json(data: Any) -> Any:
    """
    Recursively clean data for JSON serialization.
    Handles nested dictionaries, lists, and pandas/numpy objects.
    """
    if isinstance(data, dict):
        return {key: serialize_for_json(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [serialize_for_json(item) for item in data]
    elif isinstance(data, (datetime, date)):
        return data.isoformat()
    elif isinstance(data, (pd.Timestamp, np.datetime64)):
        return pd.to_datetime(data).isoformat()
    elif isinstance(data, float) and (math.isnan(data) or math.isinf(data)):
        return None
    elif isinstance(data, (np.floating, np.integer)):
        if np.isnan(data) or np.isinf(data):
            return None
        return float(data) if isinstance(data, np.floating) else int(data)
    elif pd.isna(data):
        return None
    elif isinstance(data, np.ndarray):
        return [serialize_for_json(item) for item in data.tolist()]
    elif isinstance(data, pd.Series):
        return [serialize_for_json(item) for item in data.tolist()]
    elif isinstance(data, np.bool_):
        return bool(data)
    else:
        return data


def safe_json_response(data: Any) -> dict:
    """
    Safely convert data to JSON-serializable format.
    This function ensures that the data can be serialized without errors.
    """
    try:
        # First, try to serialize the data to catch any issues
        json.dumps(data, cls=CustomJSONEncoder)
        return data
    except (TypeError, ValueError) as e:
        # If serialization fails, clean the data recursively
        cleaned_data = serialize_for_json(data)
        try:
            # Verify the cleaned data can be serialized
            json.dumps(cleaned_data, cls=CustomJSONEncoder)
            return cleaned_data
        except (TypeError, ValueError):
            # If all else fails, return a safe error response
            return {
                "error": "Data serialization failed",
                "detail": f"Could not serialize response data: {str(e)}"
            } 