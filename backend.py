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
from datetime import datetime, timedelta
from functools import wraps
import uuid
import jwt
import hashlib
import base64

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


if __name__ == '__main__':
    init_database()
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
