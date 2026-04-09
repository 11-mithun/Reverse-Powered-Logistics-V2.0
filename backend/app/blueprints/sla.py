"""
SLA & Priority Queue Manager — Feature #11
Real-time SLA tracking with urgency scoring and auto-escalation.
"""
from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
from app import db, socketio
from app.models.return_item import ReturnItem
from app.utils.auth import require_auth

sla_bp = Blueprint("sla", __name__)


def _urgency(mins):
    if mins is None: return "unknown"
    if mins < 0: return "breached"
    if mins < 60: return "critical"
    if mins < 240: return "high"
    if mins < 1440: return "medium"
    return "low"


@sla_bp.route("/queue", methods=["GET"])
@require_auth
def priority_queue():
    urgency_filter = request.args.get("urgency")
    now = datetime.utcnow()
    items = ReturnItem.query.filter(
        ReturnItem.status.in_(["pending", "processing", "escalated"])
    ).order_by(ReturnItem.sla_deadline.asc().nullslast()).limit(200).all()
    result = []
    for r in items:
        mins = int((r.sla_deadline - now).total_seconds() / 60) if r.sla_deadline else None
        u = _urgency(mins)
        if urgency_filter and u != urgency_filter: continue
        result.append({**r.to_dict(), "minutes_remaining": mins, "urgency": u,
            "sla_label": ("BREACHED" if mins is not None and mins < 0 else
                f"{mins}m left" if mins is not None and mins < 60 else
                f"{mins // 60}h left" if mins is not None else "No SLA")})
    return jsonify(result)


@sla_bp.route("/escalate/<rid>", methods=["POST"])
@require_auth
def escalate(rid):
    r = ReturnItem.query.get_or_404(rid)
    r.status = "escalated"
    r.priority_level = "High"
    if r.sla_deadline:
        r.sla_deadline = r.sla_deadline + timedelta(hours=2)
    db.session.commit()
    socketio.emit("sla_escalation", r.to_dict())
    return jsonify({**r.to_dict(), "message": "Escalated"})


@sla_bp.route("/resolve/<rid>", methods=["POST"])
@require_auth
def resolve(rid):
    r = ReturnItem.query.get_or_404(rid)
    r.status = "completed"
    r.processed_at = datetime.utcnow()
    db.session.commit()
    return jsonify(r.to_dict())


@sla_bp.route("/stats", methods=["GET"])
@require_auth
def sla_stats():
    now = datetime.utcnow()
    total = ReturnItem.query.filter(ReturnItem.status.in_(["pending","processing","escalated"])).count()
    breached = ReturnItem.query.filter(ReturnItem.sla_deadline < now, ReturnItem.status.in_(["pending","processing"])).count()
    critical = ReturnItem.query.filter(ReturnItem.sla_deadline.between(now, now + timedelta(hours=1)), ReturnItem.status.in_(["pending","processing"])).count()
    completed_on_time = ReturnItem.query.filter(ReturnItem.status == "completed", ReturnItem.processed_at <= ReturnItem.sla_deadline).count()
    total_completed = ReturnItem.query.filter_by(status="completed").count()
    return jsonify({"open_items": total, "breached": breached, "critical": critical,
        "sla_compliance_rate": round((completed_on_time / max(total_completed, 1)) * 100, 1)})


@sla_bp.route("/rules", methods=["GET"])
@require_auth
def sla_rules():
    return jsonify([
        {"priority": "High", "sla_hours": 24, "auto_escalate_after": 18, "color": "#ef4444"},
        {"priority": "Medium", "sla_hours": 48, "auto_escalate_after": 36, "color": "#FFB300"},
        {"priority": "Low", "sla_hours": 72, "auto_escalate_after": 60, "color": "#22c55e"},
    ])


@sla_bp.route("/bulk-update", methods=["POST"])
@require_auth
def bulk_update():
    data = request.get_json() or {}
    ids = data.get("ids", [])
    new_status = data.get("status", "processing")
    if new_status not in ["pending","processing","completed","escalated"]:
        return jsonify({"error": "Invalid status"}), 400
    updated = sum(1 for rid in ids[:50] if (r := ReturnItem.query.get(rid)) and setattr(r, "status", new_status) is None)
    db.session.commit()
    return jsonify({"updated": updated, "status": new_status})
