from datetime import datetime, timezone, timedelta
from math import ceil

from jinja2 import Template
def roles_list(roles):
    role_list = []
    for role in roles:
        role_list.append(role.name)
    return role_list

def calc_total(r):
    IST = timezone(timedelta(hours=5, minutes=30))
    start_time = r.parking_time
    end_time = r.leaving_time or datetime.now(IST)
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=IST)
    if end_time.tzinfo is None:
        end_time = end_time.replace(tzinfo=IST)
    duration_seconds = (end_time - start_time).total_seconds()
    hours_used = max(1, ceil(duration_seconds / 3600))
    cost = hours_used * r.cost_per_hour
    return cost





def format_report(template_path, data):
    with open(template_path) as f:
        template = Template(f.read())
    return template.render(data=data)
