import os
import shutil
import re

SERVICES = [
    'hmcs-loan-service/src/main/java/com/hmcs/loan',
    'hmcs-pawning-service/src/main/java/com/hmcs/pawning',
    'hmcs-member-auth-service/src/main/java/com/hmcs/auth'
]

SOURCE_SERVICE = 'hmcs-savings-service/src/main/java/com/hmcs/savings'
BACKEND_ROOT = 'hmcs-backend'

def copy_multitenancy_classes():
    source_multitenancy = os.path.join(BACKEND_ROOT, SOURCE_SERVICE, 'multitenancy')
    source_config = os.path.join(BACKEND_ROOT, SOURCE_SERVICE, 'config', 'WebMvcConfig.java')

    for service in SERVICES:
        target_dir = os.path.join(BACKEND_ROOT, service)
        target_multitenancy = os.path.join(target_dir, 'multitenancy')
        target_config_dir = os.path.join(target_dir, 'config')

        os.makedirs(target_multitenancy, exist_ok=True)
        os.makedirs(target_config_dir, exist_ok=True)

        package_name = service.split('src/main/java/')[1].replace('/', '.')

        # Copy and rename packages in multitenancy classes
        for file in os.listdir(source_multitenancy):
            src_file = os.path.join(source_multitenancy, file)
            dst_file = os.path.join(target_multitenancy, file)
            with open(src_file, 'r', encoding='utf-8') as f:
                content = f.read()
            content = content.replace('com.hmcs.savings', package_name)
            with open(dst_file, 'w', encoding='utf-8') as f:
                f.write(content)

        # Copy and rename WebMvcConfig
        dst_config = os.path.join(target_config_dir, 'WebMvcConfig.java')
        with open(source_config, 'r', encoding='utf-8') as f:
            content = f.read()
        content = content.replace('com.hmcs.savings', package_name)
        with open(dst_config, 'w', encoding='utf-8') as f:
            f.write(content)

        # Update JwtUtil
        jwt_util_path = os.path.join(target_dir, 'security', 'JwtUtil.java')
        if os.path.exists(jwt_util_path):
            with open(jwt_util_path, 'r', encoding='utf-8') as f:
                jwt_content = f.read()
            if 'extractTenantId' not in jwt_content:
                addition = """
    public Integer extractTenantId(String token) {
        return extractAllClaims(token).get("tenantId", Integer.class);
    }
"""
                jwt_content = re.sub(r'(\s*public String extractUsername)', addition + r'\1', jwt_content)
                with open(jwt_util_path, 'w', encoding='utf-8') as f:
                    f.write(jwt_content)

if __name__ == '__main__':
    copy_multitenancy_classes()
