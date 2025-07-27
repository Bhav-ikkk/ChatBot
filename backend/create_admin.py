#!/usr/bin/env python3
"""
Create admin user for the AI Chatbot system
"""
from dotenv import load_dotenv
import os
import hashlib
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import User, Plan, Base
import uuid

load_dotenv()
# This line is for testing, to make sure it's working
print("DATABASE_URL from .env file is:", os.getenv("DATABASE_URL"))

def create_admin_user():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        admin = db.query(User).filter(User.email == "admin@chatbot.com").first()
        if admin:
            print("❌ Admin user already exists!")
            return
        
        # Create admin user
        admin_password = "admin123"  # Change this!
        hashed_password = hashlib.sha256(admin_password.encode()).hexdigest()
        
        admin = User(
            email="admin@chatbot.com",
            username="admin",
            password_hash=hashed_password,
            is_admin=True,
            is_active=True
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("✅ Admin user created successfully!")
        print(f"   Email: admin@chatbot.com")
        print(f"   Password: {admin_password}")
        print("   ⚠️  Please change the password after first login!")
        
        # Create default plans
        plans = [
            Plan(
                name="Free",
                description="Free tier with basic features",
                price=0.00,
                daily_requests=10,
                stripe_price_id="price_free",
                is_active=True
            ),
            Plan(
                name="Pro",
                description="Professional plan with more requests",
                price=29.99,
                daily_requests=1000,
                stripe_price_id="price_pro",
                is_active=True
            ),
            Plan(
                name="Enterprise",
                description="Enterprise plan with unlimited requests",
                price=99.99,
                daily_requests=10000,
                stripe_price_id="price_enterprise",
                is_active=True
            )
        ]
        
        for plan in plans:
            existing_plan = db.query(Plan).filter(Plan.name == plan.name).first()
            if not existing_plan:
                db.add(plan)
        
        db.commit()
        print("✅ Default plans created!")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
