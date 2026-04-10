import os

#모으고 싶은 확장자 설정
extentions = ['.js','.jsx','.ts','.tsx','.css','.py']
output_file = 'project_summary.txt'

with open(output_file, 'w', encoding='utf-8') as f:
    for root, dirs, files in os.walk('.'):

        #제외할 폴더
        if 'node_modules' in root or '.git' in root:
            continue
        for file in files:
            if any(file.endswith(ext) for ext in extentions):
                file_path = os.path.join(root, file)
                f.write(f"\n\n{'='*50}")
                f.write(f"FILE:{file_path}\n")
                f.write(f"{'='*50}\n\n")
                with open(file_path, 'r', encoding='utf-8') as code_f:
                    f.write(code_f.read())
                    
print(f"모든 코드가{output_file}에 저장 되었습니다")