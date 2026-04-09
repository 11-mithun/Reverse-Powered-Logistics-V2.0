import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_socketio import SocketIO
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()
socketio = SocketIO()


def create_app():
    app = Flask(__name__, instance_relative_config=True)

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key-change-me")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///rl_platform.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024

    db.init_app(app)
    CORS(app, origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")], supports_credentials=True)
    socketio.init_app(app, cors_allowed_origins="*", async_mode="threading")

    from app.blueprints.auth import auth_bp
    from app.blueprints.returns import returns_bp
    from app.blueprints.analytics import analytics_bp
    from app.blueprints.fraud import fraud_bp
    from app.blueprints.routing import routing_bp
    from app.blueprints.marketplace import marketplace_bp
    from app.blueprints.integrations import integrations_bp
    from app.blueprints.customers import customers_bp
    from app.blueprints.sla import sla_bp
    from app.blueprints.datasets import datasets_bp
    from app.blueprints.agents import agents_bp
    from app.blueprints.premium import premium_bp

    app.register_blueprint(auth_bp,         url_prefix="/api/auth")
    app.register_blueprint(returns_bp,      url_prefix="/api/returns")
    app.register_blueprint(analytics_bp,    url_prefix="/api/analytics")
    app.register_blueprint(fraud_bp,        url_prefix="/api/fraud")
    app.register_blueprint(routing_bp,      url_prefix="/api/routing")
    app.register_blueprint(marketplace_bp,  url_prefix="/api/marketplace")
    app.register_blueprint(integrations_bp, url_prefix="/api/integrations")
    app.register_blueprint(customers_bp,    url_prefix="/api/customers")
    app.register_blueprint(sla_bp,          url_prefix="/api/sla")
    app.register_blueprint(datasets_bp,     url_prefix="/api/datasets")
    app.register_blueprint(agents_bp,       url_prefix="/api/agents")
    app.register_blueprint(premium_bp,      url_prefix="/api/premium")

    with app.app_context():
        from app.models import user, return_item, warehouse, partner, product
        db.create_all()
        _seed_defaults(app)

    return app


def _seed_defaults(app):
    from app.models.user import User
    from app.utils.seeder import seed_all

    if User.query.count() == 0:
        admin = User(
            email=os.getenv("ADMIN_EMAIL", "admin@rlplatform.com"),
            name=os.getenv("ADMIN_NAME", "System Admin"),
            role="admin",
        )
        admin.set_password(os.getenv("ADMIN_PASSWORD", "Admin@123456"))

        demo = User(
            email=os.getenv("DEMO_EMAIL", "demo@customer.com"),
            name="Demo Customer",
            role="customer",
        )
        demo.set_password(os.getenv("DEMO_PASSWORD", "Demo@123456"))

        from app import db
        db.session.add_all([admin, demo])
        db.session.commit()
        seed_all()
        print("✅ Default users and seed data created.")
