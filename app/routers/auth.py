class MockUser:
    """模拟用户类，用于临时替代认证"""
    def __init__(self):
        self.id = 1
        self.username = "demo_user"
        self.email = "demo@example.com"
        self.is_admin = False
        self.is_active = True


def get_current_user() -> MockUser:
    """获取当前用户（临时模拟实现）"""
    return MockUser()
