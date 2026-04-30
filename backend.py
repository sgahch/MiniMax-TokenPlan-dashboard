"""
Token Plan Dashboard 后端服务
pip install flask flask-cors pymysql python-dotenv requests pyjwt werkzeug
"""

import os
from flask import Flask, jsonify, request, g
from flask_cors import CORS
import pymysql
from contextlib import contextmanager
import requests
from datetime import datetime, timedelta, date
from functools import wraps
import uuid
import jwt
import hashlib
import base64

# APScheduler for daily snapshot collection
from apscheduler.schedulers.background import BackgroundScheduler

app = Flask(__name__)
CORS(app)

# JWT 配置
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRE_HOURS = 24 * 7  # 7天过期

# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '123456',
    'database': 'token_plan_dashboard',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}


@contextmanager
def get_db():
    """数据库连接上下文管理器"""
    conn = pymysql.connect(**DB_CONFIG)
    try:
        cursor = conn.cursor()
        yield cursor
        conn.commit()
    finally:
        conn.close()


def init_database():
    """初始化数据库表"""
    conn = pymysql.connect(
        host=DB_CONFIG['host'],
        port=DB_CONFIG['port'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password'],
        charset='utf8mb4'
    )
    try:
        with conn.cursor() as cursor:
            cursor.execute("CREATE DATABASE IF NOT EXISTS token_plan_dashboard "
                          "DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            cursor.execute("USE token_plan_dashboard")

            # 创建用户表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(36) PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    is_admin BOOLEAN DEFAULT FALSE,
                    created_at BIGINT DEFAULT (UNIX_TIMESTAMP() * 1000)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)

            # 创建分组表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `groups` (
                    id VARCHAR(36) PRIMARY KEY,
                    user_id VARCHAR(36) NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    created_at BIGINT DEFAULT (UNIX_TIMESTAMP() * 1000),
                    INDEX idx_user_id (user_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)

            # 创建账号表（添加 user_id, group_id）
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS accounts (
                    id VARCHAR(36) PRIMARY KEY,
                    user_id VARCHAR(36),
                    group_id VARCHAR(36) DEFAULT NULL,
                    name VARCHAR(255) NOT NULL,
                    api_key VARCHAR(500) NOT NULL,
                    created_at BIGINT DEFAULT (UNIX_TIMESTAMP() * 1000),
                    INDEX idx_created_at (created_at),
                    INDEX idx_user_id (user_id),
                    INDEX idx_group_id (group_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)

            # 创建每日用量快照表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS daily_usage_snapshots (
                    id VARCHAR(36) PRIMARY KEY,
                    account_id VARCHAR(36) NOT NULL,
                    model_name VARCHAR(255) NOT NULL,
                    week_start_date DATE NOT NULL,
                    weekly_total_count INT DEFAULT 0,
                    mon_usage INT DEFAULT 0,
                    tue_usage INT DEFAULT 0,
                    wed_usage INT DEFAULT 0,
                    thu_usage INT DEFAULT 0,
                    fri_usage INT DEFAULT 0,
                    sat_usage INT DEFAULT 0,
                    sun_usage INT DEFAULT 0,
                    current_day INT DEFAULT 1,
                    created_at BIGINT,
                    updated_at BIGINT,
                    UNIQUE KEY uk_account_model_week (account_id, model_name, week_start_date),
                    INDEX idx_week_start_date (week_start_date)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)

            # 创建拼车用户表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS account_share_users (
                    id VARCHAR(36) PRIMARY KEY,
                    account_id VARCHAR(36) NOT NULL,
                    username VARCHAR(100) NOT NULL,
                    created_at BIGINT DEFAULT (UNIX_TIMESTAMP() * 1000),
                    INDEX idx_account_id (account_id),
                    UNIQUE KEY uk_account_username (account_id, username),
                    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)

        conn.commit()
        print("[DB] 数据库初始化完成")
    finally:
        conn.close()

    # 创建 admin 用户
    init_admin()


def init_admin():
    """初始化 admin 用户"""
    with get_db() as cursor:
        cursor.execute("SELECT id FROM users WHERE is_admin = TRUE LIMIT 1")
        if cursor.fetchone() is None:
            admin_id = str(uuid.uuid4())
            password_hash = hash_password('admin123')
            created_at = int(datetime.now().timestamp() * 1000)
            cursor.execute(
                "INSERT INTO users (id, username, password_hash, is_admin, created_at) VALUES (%s, %s, %s, %s, %s)",
                (admin_id, 'admin', password_hash, True, created_at)
            )
            print("[DB] Admin 用户已创建 (admin/admin123)")


def hash_password(password: str) -> str:
    """简单密码哈希（生产环境建议使用 bcrypt）"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    """验证密码"""
    return hash_password(password) == password_hash


def generate_token(user_id: str, username: str, is_admin: bool) -> str:
    """生成 JWT Token"""
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {
        'user_id': user_id,
        'username': username,
        'is_admin': is_admin,
        'exp': expire,
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def jwt_required(f):
    """JWT 认证装饰器"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': '缺少认证令牌'}), 401

        token = auth_header[7:]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            g.user_id = payload['user_id']
            g.username = payload['username']
            g.is_admin = payload['is_admin']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': '令牌已过期'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': '无效的令牌'}), 401

        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """Admin 专属装饰器"""
    @wraps(f)
    @jwt_required
    def decorated(*args, **kwargs):
        if not g.is_admin:
            return jsonify({'error': '需要管理员权限'}), 403
        return f(*args, **kwargs)
    return decorated


# ============ 认证 API ============

@app.route('/api/auth/register', methods=['POST'])
def register():
    """用户注册"""
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'username 和 password 必填'}), 400

    username = data['username'].strip()
    password = data['password']

    if len(username) < 3 or len(username) > 50:
        return jsonify({'error': '用户名长度需在 3-50 之间'}), 400

    if len(password) < 6:
        return jsonify({'error': '密码长度至少 6 位'}), 400

    user_id = str(uuid.uuid4())
    password_hash = hash_password(password)
    created_at = int(datetime.now().timestamp() * 1000)

    try:
        with get_db() as cursor:
            cursor.execute(
                "INSERT INTO users (id, username, password_hash, is_admin, created_at) VALUES (%s, %s, %s, %s, %s)",
                (user_id, username, password_hash, False, created_at)
            )
        token = generate_token(user_id, username, False)
        return jsonify({
            'id': user_id,
            'username': username,
            'token': token
        }), 201
    except pymysql.err.IntegrityError:
        return jsonify({'error': '用户名已存在'}), 409


@app.route('/api/auth/login', methods=['POST'])
def login():
    """用户登录"""
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'username 和 password 必填'}), 400

    username = data['username'].strip()
    password = data['password']

    with get_db() as cursor:
        cursor.execute("SELECT id, username, password_hash, is_admin FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()

    if not user or not verify_password(password, user['password_hash']):
        return jsonify({'error': '用户名或密码错误'}), 401

    token = generate_token(user['id'], user['username'], user['is_admin'])
    return jsonify({
        'id': user['id'],
        'username': user['username'],
        'is_admin': user['is_admin'],
        'token': token
    })


@app.route('/api/auth/me', methods=['GET'])
@jwt_required
def get_me():
    """获取当前用户信息"""
    return jsonify({
        'id': g.user_id,
        'username': g.username,
        'is_admin': g.is_admin
    })


@app.route('/api/auth/change-password', methods=['POST'])
@jwt_required
def change_password():
    """修改密码"""
    data = request.get_json()
    if not data or not data.get('old_password') or not data.get('new_password'):
        return jsonify({'error': '旧密码和新密码必填'}), 400

    old_password = data['old_password']
    new_password = data['new_password']

    if len(new_password) < 6:
        return jsonify({'error': '新密码长度至少 6 位'}), 400

    with get_db() as cursor:
        cursor.execute("SELECT id, password_hash FROM users WHERE id = %s", (g.user_id,))
        user = cursor.fetchone()

    if not user or not verify_password(old_password, user['password_hash']):
        return jsonify({'error': '旧密码错误'}), 401

    new_password_hash = hash_password(new_password)
    with get_db() as cursor:
        cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_password_hash, g.user_id))

    return jsonify({'success': True})


# ============ 账号管理 API ============

@app.route('/api/accounts', methods=['GET'])
@jwt_required
def get_accounts():
    """获取当前用户的账号"""
    group_id = request.args.get('group_id')
    with get_db() as cursor:
        if g.is_admin:
            # Admin 可以看所有账号
            if group_id:
                cursor.execute('SELECT id, name, api_key, created_at, user_id, group_id FROM accounts WHERE group_id = %s ORDER BY created_at DESC', (group_id,))
            else:
                cursor.execute('SELECT id, name, api_key, created_at, user_id, group_id FROM accounts ORDER BY created_at DESC')
        else:
            if group_id:
                cursor.execute('SELECT id, name, api_key, created_at, user_id, group_id FROM accounts WHERE user_id = %s AND group_id = %s ORDER BY created_at DESC', (g.user_id, group_id))
            else:
                cursor.execute('SELECT id, name, api_key, created_at, user_id, group_id FROM accounts WHERE user_id = %s ORDER BY created_at DESC', (g.user_id,))
        accounts = cursor.fetchall()
    return jsonify(accounts)


@app.route('/api/accounts', methods=['POST'])
@jwt_required
def add_account():
    """添加账号"""
    data = request.get_json()
    if not data or not data.get('name') or not data.get('api_key'):
        return jsonify({'error': 'name 和 api_key 必填'}), 400

    account_id = str(uuid.uuid4())
    created_at = int(datetime.now().timestamp() * 1000)
    group_id = data.get('group_id') or None

    with get_db() as cursor:
        cursor.execute(
            'INSERT INTO accounts (id, user_id, group_id, name, api_key, created_at) VALUES (%s, %s, %s, %s, %s, %s)',
            (account_id, g.user_id, group_id, data['name'], data['api_key'], created_at)
        )
    return jsonify({'id': account_id, 'name': data['name'], 'api_key': data['api_key'], 'created_at': created_at, 'user_id': g.user_id, 'group_id': group_id}), 201


@app.route('/api/accounts/<account_id>', methods=['PUT'])
@jwt_required
def update_account(account_id):
    """更新账号"""
    data = request.get_json()
    if not data or not data.get('name') or not data.get('api_key'):
        return jsonify({'error': 'name 和 api_key 必填'}), 400

    with get_db() as cursor:
        # 检查权限：自己的账号或者 admin
        if not g.is_admin:
            cursor.execute('SELECT user_id FROM accounts WHERE id = %s', (account_id,))
            account = cursor.fetchone()
            if not account or account['user_id'] != g.user_id:
                return jsonify({'error': '无权修改此账号'}), 403

        group_id = data.get('group_id') or None
        cursor.execute(
            'UPDATE accounts SET name = %s, api_key = %s, group_id = %s WHERE id = %s',
            (data['name'], data['api_key'], group_id, account_id)
        )
        if cursor.rowcount == 0:
            return jsonify({'error': '账号不存在'}), 404
    return jsonify({'id': account_id, 'name': data['name'], 'api_key': data['api_key'], 'group_id': group_id})


@app.route('/api/accounts/<account_id>', methods=['DELETE'])
@jwt_required
def delete_account(account_id):
    """删除账号"""
    with get_db() as cursor:
        # 检查权限：自己的账号或者 admin
        if not g.is_admin:
            cursor.execute('SELECT user_id FROM accounts WHERE id = %s', (account_id,))
            account = cursor.fetchone()
            if not account or account['user_id'] != g.user_id:
                return jsonify({'error': '无权删除此账号'}), 403

        cursor.execute('DELETE FROM accounts WHERE id = %s', (account_id,))
        if cursor.rowcount == 0:
            return jsonify({'error': '账号不存在'}), 404
    return jsonify({'success': True})


# ============ 拼车管理 API ============

@app.route('/api/accounts/<account_id>/share-users', methods=['GET'])
@jwt_required
def get_share_users(account_id):
    """获取账号的拼车用户列表"""
    with get_db() as cursor:
        # 检查权限
        if g.is_admin:
            cursor.execute('SELECT user_id FROM accounts WHERE id = %s', (account_id,))
        else:
            cursor.execute('SELECT user_id FROM accounts WHERE id = %s AND user_id = %s', (account_id, g.user_id))
        account = cursor.fetchone()
        if not account:
            return jsonify({'error': '账号不存在'}), 404

        cursor.execute(
            'SELECT id, account_id, username, created_at FROM account_share_users WHERE account_id = %s ORDER BY created_at DESC',
            (account_id,)
        )
        users = cursor.fetchall()
    return jsonify(users)


@app.route('/api/accounts/<account_id>/share-users', methods=['POST'])
@jwt_required
def add_share_user(account_id):
    """添加拼车用户"""
    data = request.get_json()
    if not data or not data.get('username'):
        return jsonify({'error': 'username 必填'}), 400

    username = data['username'].strip()
    if len(username) < 1 or len(username) > 100:
        return jsonify({'error': '用户名长度需在 1-100 之间'}), 400

    with get_db() as cursor:
        # 检查权限
        if g.is_admin:
            cursor.execute('SELECT user_id FROM accounts WHERE id = %s', (account_id,))
        else:
            cursor.execute('SELECT user_id FROM accounts WHERE id = %s AND user_id = %s', (account_id, g.user_id))
        account = cursor.fetchone()
        if not account:
            return jsonify({'error': '账号不存在'}), 404

        # 检查是否已存在
        cursor.execute(
            'SELECT id FROM account_share_users WHERE account_id = %s AND username = %s',
            (account_id, username)
        )
        if cursor.fetchone():
            return jsonify({'error': '该用户已在拼车列表中'}), 409

        user_id = str(uuid.uuid4())
        created_at = int(datetime.now().timestamp() * 1000)
        cursor.execute(
            'INSERT INTO account_share_users (id, account_id, username, created_at) VALUES (%s, %s, %s, %s)',
            (user_id, account_id, username, created_at)
        )
    return jsonify({'id': user_id, 'account_id': account_id, 'username': username, 'created_at': created_at}), 201


@app.route('/api/accounts/<account_id>/share-users/<user_id>', methods=['DELETE'])
@jwt_required
def remove_share_user(account_id, user_id):
    """删除拼车用户"""
    with get_db() as cursor:
        # 检查权限
        if g.is_admin:
            cursor.execute('SELECT user_id FROM accounts WHERE id = %s', (account_id,))
        else:
            cursor.execute('SELECT user_id FROM accounts WHERE id = %s AND user_id = %s', (account_id, g.user_id))
        account = cursor.fetchone()
        if not account:
            return jsonify({'error': '账号不存在'}), 404

        cursor.execute('DELETE FROM account_share_users WHERE id = %s AND account_id = %s', (user_id, account_id))
        if cursor.rowcount == 0:
            return jsonify({'error': '拼车用户不存在'}), 404
    return jsonify({'success': True})


# ============ 分组管理 API ============

@app.route('/api/groups', methods=['GET'])
@jwt_required
def get_groups():
    """获取当前用户的分组"""
    with get_db() as cursor:
        cursor.execute('SELECT id, name, created_at FROM `groups` WHERE user_id = %s ORDER BY created_at DESC', (g.user_id,))
        groups = cursor.fetchall()
    return jsonify(groups)


@app.route('/api/groups', methods=['POST'])
@jwt_required
def create_group():
    """创建分组"""
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'name 必填'}), 400

    name = data['name'].strip()
    if len(name) < 1 or len(name) > 100:
        return jsonify({'error': '分组名称长度需在 1-100 之间'}), 400

    group_id = str(uuid.uuid4())
    created_at = int(datetime.now().timestamp() * 1000)

    with get_db() as cursor:
        cursor.execute(
            'INSERT INTO `groups` (id, user_id, name, created_at) VALUES (%s, %s, %s, %s)',
            (group_id, g.user_id, name, created_at)
        )
    return jsonify({'id': group_id, 'name': name, 'created_at': created_at}), 201


@app.route('/api/groups/<group_id>', methods=['PUT'])
@jwt_required
def update_group(group_id):
    """更新分组(重命名)"""
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'name 必填'}), 400

    name = data['name'].strip()
    if len(name) < 1 or len(name) > 100:
        return jsonify({'error': '分组名称长度需在 1-100 之间'}), 400

    with get_db() as cursor:
        # 检查权限：自己的分组或者 admin
        if not g.is_admin:
            cursor.execute('SELECT user_id FROM `groups` WHERE id = %s', (group_id,))
            group = cursor.fetchone()
            if not group or group['user_id'] != g.user_id:
                return jsonify({'error': '无权修改此分组'}), 403

        cursor.execute('UPDATE `groups` SET name = %s WHERE id = %s', (name, group_id))
        if cursor.rowcount == 0:
            return jsonify({'error': '分组不存在'}), 404
    return jsonify({'id': group_id, 'name': name})


@app.route('/api/groups/<group_id>', methods=['DELETE'])
@jwt_required
def delete_group(group_id):
    """删除分组"""
    with get_db() as cursor:
        # 检查权限：自己的分组或者 admin
        if not g.is_admin:
            cursor.execute('SELECT user_id FROM `groups` WHERE id = %s', (group_id,))
            group = cursor.fetchone()
            if not group or group['user_id'] != g.user_id:
                return jsonify({'error': '无权删除此分组'}), 403

        cursor.execute('DELETE FROM `groups` WHERE id = %s', (group_id,))
        if cursor.rowcount == 0:
            return jsonify({'error': '分组不存在'}), 404
    return jsonify({'success': True})


# ============ Token Plan 查询 API ============

MINIMAX_API_URL = 'https://www.minimaxi.com/v1/api/openplatform/coding_plan/remains'

@app.route('/api/accounts/<account_id>/remains', methods=['GET'])
@jwt_required
def get_account_remains(account_id):
    """获取指定账号的 Token 套餐余额"""
    with get_db() as cursor:
        # 检查权限
        if g.is_admin:
            cursor.execute('SELECT api_key, user_id FROM accounts WHERE id = %s', (account_id,))
        else:
            cursor.execute('SELECT api_key, user_id FROM accounts WHERE id = %s AND user_id = %s', (account_id, g.user_id))
        account = cursor.fetchone()

        if not account:
            return jsonify({'error': '账号不存在'}), 404

    try:
        response = requests.post(
            MINIMAX_API_URL,
            headers={'Authorization': f'Bearer {account["api_key"]}'},
            json={'model': '*'},
            timeout=120
        )
        response.raise_for_status()
        data = response.json()
        return jsonify(data)
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'请求失败: {str(e)}'}), 500


@app.route('/api/accounts/remains', methods=['GET'])
@jwt_required
def get_all_remains():
    """批量获取所有账号的 Token 套餐余额"""
    with get_db() as cursor:
        if g.is_admin:
            cursor.execute('SELECT id, api_key FROM accounts')
        else:
            cursor.execute('SELECT id, api_key FROM accounts WHERE user_id = %s', (g.user_id,))
        accounts = cursor.fetchall()

    results = []
    for acc in accounts:
        try:
            resp = requests.post(
                MINIMAX_API_URL,
                headers={'Authorization': f'Bearer {acc["api_key"]}'},
                json={'model': '*'},
                timeout=120
            )
            resp.raise_for_status()
            data = resp.json()
            results.append({'account_id': acc['id'], 'data': data, 'error': None})
        except requests.exceptions.RequestException as e:
            results.append({'account_id': acc['id'], 'data': None, 'error': str(e)})

    return jsonify(results)


# ============ 用量快照 API ============

@app.route('/api/usage/snapshots', methods=['POST'])
@jwt_required
def create_usage_snapshot():
    """接收前端采集的每日用量快照数据"""
    data = request.get_json()
    if not data or not data.get('snapshots'):
        return jsonify({'error': 'snapshots 数据必填'}), 400

    snapshots = data['snapshots']  # [{account_id, model_name, weekly_usage, weekly_total, week_start}, ...]
    today = date.today()
    # today.weekday() 返回 0=周一, 1=周二, ..., 6=周日
    day_columns = ['mon_usage', 'tue_usage', 'wed_usage', 'thu_usage', 'fri_usage', 'sat_usage', 'sun_usage']
    today_column = day_columns[today.weekday()]

    snapshots_created = 0
    snapshots_updated = 0

    with get_db() as cursor:
        for snapshot in snapshots:
            account_id = snapshot['account_id']
            model_name = snapshot['model_name']
            weekly_usage = snapshot.get('weekly_usage', 0)  # 存储已用量
            weekly_total = snapshot.get('weekly_total', 0)
            week_start_str = snapshot.get('week_start', '')

            # 解析 week_start
            if week_start_str:
                week_start = datetime.strptime(week_start_str, '%Y-%m-%d').date()
            else:
                week_start = today - timedelta(days=today.weekday())

            now = int(datetime.now().timestamp() * 1000)

            # 检查是否已存在记录
            cursor.execute(
                'SELECT id, mon_usage, tue_usage, wed_usage, thu_usage, fri_usage, sat_usage, sun_usage FROM daily_usage_snapshots WHERE account_id = %s AND model_name = %s AND week_start_date = %s',
                (account_id, model_name, week_start)
            )
            existing = cursor.fetchone()

            if existing:
                # 如果是周一，重置所有其他天的数据
                if today.weekday() == 0:
                    reset_sql = ', '.join([f'{col} = 0' for col in day_columns])
                    cursor.execute(
                        f"UPDATE daily_usage_snapshots SET {reset_sql}, {today_column} = %s, weekly_total_count = %s, updated_at = %s WHERE id = %s",
                        (weekly_usage, weekly_total, now, existing['id'])
                    )
                else:
                    cursor.execute(
                        f"UPDATE daily_usage_snapshots SET {today_column} = %s, weekly_total_count = %s, current_day = %s, updated_at = %s WHERE id = %s",
                        (weekly_usage, weekly_total, today.weekday() + 1, now, existing['id'])
                    )
                snapshots_updated += 1
            else:
                # 新建记录，其他天默认为0
                snapshot_id = str(uuid.uuid4())
                col_values = {col: 0 for col in day_columns}
                col_values[today_column] = weekly_usage
                cursor.execute("""
                    INSERT INTO daily_usage_snapshots
                    (id, account_id, model_name, week_start_date, weekly_total_count, mon_usage, tue_usage, wed_usage, thu_usage, fri_usage, sat_usage, sun_usage, current_day, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    snapshot_id, account_id, model_name, week_start, weekly_total,
                    col_values['mon_usage'], col_values['tue_usage'], col_values['wed_usage'],
                    col_values['thu_usage'], col_values['fri_usage'], col_values['sat_usage'],
                    col_values['sun_usage'], today.weekday() + 1, now, now
                ))
                snapshots_created += 1

    print(f"[Snapshot] Saved: created={snapshots_created}, updated={snapshots_updated}")

    return jsonify({
        'success': True,
        'snapshot_date': str(today),
        'week_start': str(week_start),
        'snapshots_created': snapshots_created,
        'snapshots_updated': snapshots_updated,
    })


@app.route('/api/usage/daily', methods=['GET'])
@jwt_required
def get_daily_usage():
    """获取指定账号+模型的某周每日用量"""
    account_id = request.args.get('account_id')
    model_name = request.args.get('model_name')
    week_start = request.args.get('week_start')  # YYYY-MM-DD 格式

    if not account_id or not model_name or not week_start:
        return jsonify({'error': 'account_id, model_name, week_start 参数必填'}), 400

    week_start_date = datetime.strptime(week_start, '%Y-%m-%d').date()

    with get_db() as cursor:
        # 获取该周所有快照
        cursor.execute("""
            SELECT snapshot_date, daily_usage_count, weekly_usage_at_snapshot, weekly_total_count
            FROM daily_usage_snapshots
            WHERE account_id = %s AND model_name = %s AND week_start_date = %s
            ORDER BY snapshot_date ASC
        """, (account_id, model_name, week_start_date))
        snapshots = cursor.fetchall()

    day_names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    daily_usage = []

    for i in range(7):
        day_date = week_start_date + timedelta(days=i)
        day_str = str(day_date)

        # 查找该天的快照
        snapshot = next((s for s in snapshots if str(s['snapshot_date']) == day_str), None)

        usage = snapshot['daily_usage_count'] if snapshot else 0
        weekly_used = snapshot['weekly_usage_at_snapshot'] if snapshot else 0
        weekly_total = snapshot['weekly_total_count'] if snapshot else 0

        # 计算环比变化
        percent_change = None
        if i > 0 and daily_usage[i-1]['usage'] > 0:
            prev_usage = daily_usage[i-1]['usage']
            percent_change = round(((usage - prev_usage) / prev_usage) * 100, 2)

        daily_usage.append({
            'date': day_str,
            'day': day_names[i],
            'usage': usage,
            'percent_change': percent_change,
            'weekly_used': weekly_used,
            'weekly_total': weekly_total
        })

    return jsonify({
        'account_id': account_id,
        'model_name': model_name,
        'week_start': week_start,
        'week_end': str(week_start_date + timedelta(days=6)),
        'daily_usage': daily_usage
    })


@app.route('/api/usage/daily-summary', methods=['GET'])
@jwt_required
def get_daily_usage_summary():
    """获取账号下所有模型的每日用量汇总"""
    account_id = request.args.get('account_id')
    week_start = request.args.get('week_start')  # YYYY-MM-DD 格式

    if not account_id or not week_start:
        return jsonify({'error': 'account_id, week_start 参数必填'}), 400

    week_start_date = datetime.strptime(week_start, '%Y-%m-%d').date()

    with get_db() as cursor:
        # 获取该账号该周所有模型的快照，按周汇总
        cursor.execute("""
            SELECT
                SUM(mon_usage) as mon_usage,
                SUM(tue_usage) as tue_usage,
                SUM(wed_usage) as wed_usage,
                SUM(thu_usage) as thu_usage,
                SUM(fri_usage) as fri_usage,
                SUM(sat_usage) as sat_usage,
                SUM(sun_usage) as sun_usage,
                MAX(weekly_total_count) as weekly_total
            FROM daily_usage_snapshots
            WHERE account_id = %s AND week_start_date = %s
        """, (account_id, week_start_date))
        row = cursor.fetchone()

    day_names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    day_columns = ['mon_usage', 'tue_usage', 'wed_usage', 'thu_usage', 'fri_usage', 'sat_usage', 'sun_usage']
    daily_usage = []

    for i in range(7):
        day_date = week_start_date + timedelta(days=i)
        day_str = str(day_date)
        usage = row[day_columns[i]] if row and row[day_columns[i]] else 0

        percent_change = None
        if i > 0 and len(daily_usage) > 0 and daily_usage[i-1]['usage'] > 0:
            prev_usage = daily_usage[i-1]['usage']
            percent_change = round(((usage - prev_usage) / prev_usage) * 100, 2)

        daily_usage.append({
            'date': day_str,
            'day': day_names[i],
            'usage': usage,
            'percent_change': percent_change,
            'weekly_used': usage,  # 当天已用量
            'weekly_total': row['weekly_total'] if row and row['weekly_total'] else 0
        })

    return jsonify({
        'account_id': account_id,
        'week_start': week_start,
        'week_end': str(week_start_date + timedelta(days=6)),
        'daily_usage': daily_usage
    })


def collect_all_snapshots():
    """后台定时任务：每日自动采集所有账号快照"""
    with app.app_context():
        try:
            with get_db() as cursor:
                cursor.execute('SELECT id, api_key FROM accounts')
                accounts = cursor.fetchall()

            today = date.today()
            week_start = today - timedelta(days=today.weekday())
            day_columns = ['mon_usage', 'tue_usage', 'wed_usage', 'thu_usage', 'fri_usage', 'sat_usage', 'sun_usage']
            today_column = day_columns[today.weekday()]

            print(f"[Snapshot] Starting daily collection for {today}, today_column={today_column}")

            for acc in accounts:
                try:
                    resp = requests.post(
                        MINIMAX_API_URL,
                        headers={'Authorization': f'Bearer {acc["api_key"]}'},
                        json={'model': '*'},
                        timeout=120
                    )
                    resp.raise_for_status()
                    data = resp.json()

                    model_remains = data.get('model_remains', []) if isinstance(data, dict) else []

                    with get_db() as cursor:
                        for model in model_remains:
                            model_name = model.get('model_name', 'unknown')
                            # 只处理 MiniMax-M* 模型
                            if not model_name.startswith('MiniMax-M'):
                                continue

                            # current_weekly_usage_count 实际上是剩余额度，已用量 = 总额 - 剩余
                            weekly_usage = model.get('current_weekly_total_count', 0) - model.get('current_weekly_usage_count', 0)
                            weekly_total = model.get('current_weekly_total_count', 0)

                            # 检查是否已存在记录
                            cursor.execute(
                                'SELECT id FROM daily_usage_snapshots WHERE account_id = %s AND model_name = %s AND week_start_date = %s',
                                (acc['id'], model_name, week_start)
                            )
                            existing = cursor.fetchone()

                            now = int(datetime.now().timestamp() * 1000)

                            if existing:
                                # 如果是周一，重置所有其他天的数据
                                if today.weekday() == 0:
                                    reset_sql = ', '.join([f'{col} = 0' for col in day_columns])
                                    cursor.execute(
                                        f"UPDATE daily_usage_snapshots SET {reset_sql}, {today_column} = %s, weekly_total_count = %s, updated_at = %s WHERE id = %s",
                                        (weekly_usage, weekly_total, now, existing['id'])
                                    )
                                else:
                                    cursor.execute(
                                        f"UPDATE daily_usage_snapshots SET {today_column} = %s, weekly_total_count = %s, current_day = %s, updated_at = %s WHERE id = %s",
                                        (weekly_usage, weekly_total, today.weekday() + 1, now, existing['id'])
                                    )
                            else:
                                # 新建记录
                                snapshot_id = str(uuid.uuid4())
                                col_values = {col: 0 for col in day_columns}
                                col_values[today_column] = weekly_usage
                                cursor.execute("""
                                    INSERT INTO daily_usage_snapshots
                                    (id, account_id, model_name, week_start_date, weekly_total_count, mon_usage, tue_usage, wed_usage, thu_usage, fri_usage, sat_usage, sun_usage, current_day, created_at, updated_at)
                                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                                """, (
                                    snapshot_id, acc['id'], model_name, week_start, weekly_total,
                                    col_values['mon_usage'], col_values['tue_usage'], col_values['wed_usage'],
                                    col_values['thu_usage'], col_values['fri_usage'], col_values['sat_usage'],
                                    col_values['sun_usage'], today.weekday() + 1, now, now
                                ))

                    print(f"[Snapshot] Account {acc['id']} collected")
                except Exception as e:
                    print(f"[Snapshot] Error for account {acc['id']}: {e}")

            print(f"[Snapshot] Daily collection completed for {today}")
        except Exception as e:
            print(f"[Snapshot] Scheduled collection failed: {e}")


# 启动定时任务调度器
scheduler = BackgroundScheduler()
scheduler.add_job(
    func=collect_all_snapshots,
    trigger='cron',
    hour=23,
    minute=30,
    timezone='Asia/Shanghai'
)


if __name__ == '__main__':
    init_database()
    scheduler.start()
    print("[Scheduler] Daily snapshot collection scheduled at 23:30 Asia/Shanghai")
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
