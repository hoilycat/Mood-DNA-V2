import google.generativeai as genai

# 1. 아까 그 새 계정에서 받은 API 키를 넣어줘!
genai.configure(api_key="REMOVED_KEY")

print("🔍 현재 사용 가능한 제미나이 모델 목록:")
print("-" * 50)

# 2. 제미나이 학교에서 '말하기(generateContent)'가 가능한 친구들만 찾아보기
for model in genai.list_models():
    if 'generateContent' in model.supported_generation_methods:
        # 모델의 진짜 이름(name)과 설명(description)을 출력해줘
        print(f"✅ 모델명: {model.name}")
        print(f"   ㄴ 설명: {model.description}")
        print("-" * 50)