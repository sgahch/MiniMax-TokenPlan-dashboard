"""
Token Plan Dashboard 后端服务
pip install flask flask-cors pymysql python-dotenv requests
"""

import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import pymysql
from contextlib import contextmanager
import requests
from datetime import datetime

app = Flask(__name__)
CORS(app)

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
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS accounts (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    api_key VARCHAR(500) NOT NULL,
                    created_at BIGINT DEFAULT (UNIX_TIMESTAMP() * 1000),
                    INDEX idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
        conn.commit()
        print("[DB] 数据库初始化完成")
    finally:
        conn.close()


# ============ 账号管理 API ============

@app.route('/api/accounts', methods=['GET'])
def get_accounts():
    """获取所有账号"""
    with get_db() as cursor:
        cursor.execute('SELECT id, name, api_key, created_at FROM accounts ORDER BY created_at DESC')
        accounts = cursor.fetchall()
    return jsonify(accounts)


@app.route('/api/accounts', methods=['POST'])
def add_account():
    """添加账号"""
    data = request.get_json()
    if not data or not data.get('name') or not data.get('api_key'):
        return jsonify({'error': 'name 和 api_key 必填'}), 400

    import uuid
    account_id = str(uuid.uuid4())
    created_at = int(datetime.now().timestamp() * 1000)

    with get_db() as cursor:
        cursor.execute(
            'INSERT INTO accounts (id, name, api_key, created_at) VALUES (%s, %s, %s, %s)',
            (account_id, data['name'], data['api_key'], created_at)
        )
    return jsonify({'id': account_id, 'name': data['name'], 'api_key': data['api_key'], 'created_at': created_at}), 201


@app.route('/api/accounts/<account_id>', methods=['PUT'])
def update_account(account_id):
    """更新账号"""
    data = request.get_json()
    if not data or not data.get('name') or not data.get('api_key'):
        return jsonify({'error': 'name 和 api_key 必填'}), 400

    with get_db() as cursor:
        cursor.execute(
            'UPDATE accounts SET name = %s, api_key = %s WHERE id = %s',
            (data['name'], data['api_key'], account_id)
        )
        if cursor.rowcount == 0:
            return jsonify({'error': '账号不存在'}), 404
    return jsonify({'id': account_id, 'name': data['name'], 'api_key': data['api_key']})


@app.route('/api/accounts/<account_id>', methods=['DELETE'])
def delete_account(account_id):
    """删除账号"""
    with get_db() as cursor:
        cursor.execute('DELETE FROM accounts WHERE id = %s', (account_id,))
        if cursor.rowcount == 0:
            return jsonify({'error': '账号不存在'}), 404
    return jsonify({'success': True})


# ============ Token Plan 查询 API ============

MINIMAX_API_URL = 'https://www.minimaxi.com/v1/api/openplatform/coding_plan/remains'

@app.route('/api/accounts/<account_id>/remains', methods=['GET'])
def get_account_remains(account_id):
    """获取指定账号的 Token 套餐余额"""
    with get_db() as cursor:
        cursor.execute('SELECT api_key FROM accounts WHERE id = %s', (account_id,))
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
def get_all_remains():
    """批量获取所有账号的 Token 套餐余额（由前端调用各自账号的 remains）"""
    with get_db() as cursor:
        cursor.execute('SELECT id, api_key FROM accounts')
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
