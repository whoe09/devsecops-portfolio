### GitHub OIDC [sub] 클레임의 불변 ID(@owner_id,@repo_id) 바인딩을 통한 Repo Jacking 방어
- 문제 상황
  - AWS Access Key 하드코딩 제거 -> GitHub OIDC&IAM Role 연동 -> 'sts:AssumeRoleWithWebIdentity' 권한 거부 발생.
- 원인 분석
  - AWS STS의 에러 분석 위해 Runer 내부 '$ACTION_ID_TOKEN_REQUEST_URL'에서 발급되는 JWT Payload 디코딩
  - 최신 GitHub OIDC 환경 = sub 클레임에 고유 식별 번호가 포함됨 확인
- 해결 및 보안 효과
  - ID + main 브렌치 참조값을 IAM Trust Policy의 stringEquals 조건에 바인딩
