# 6 배포

기준: [연동 계약](4-1-CONTRACT.md), [검증](5-1-VERIFICATION.md).

<br>

### 6-1 배포 경로

| 단계 | 내용 |
|---|---|
| 빌드 | 없음<br>확장 소스 폴더가 그대로 배포물 |
| 버전 | `manifest.json`의 `version`<br>스토어에 제출할 때마다 올림 |
| 패키지 | `main`의 버전 태그 커밋에서 확장 소스 폴더를 zip 하나로 묶음<br>zip 최상위에 `manifest.json`이 있음 |
| 제출 | 같은 zip을 Chrome 웹 스토어, 네이버 웨일 스토어, Firefox Add-ons에 각각 제출<br>스토어별로 `manifest.json`을 고치지 않음 |
| 반영 | 스토어별 심사 뒤 설치한 사용자에게 업데이트됨 |

<br>

### 6-2 호환 조건

| 변경 | 조건 |
|---|---|
| `host_permissions`에 새 호스트 추가 | Chrome 정책상 새 권한 경고 대상<br>업데이트 뒤 사용자가 새 권한을 승인할 때까지 확장이 꺼질 수 있음 |
| Firefox 확장 ID | `browser_specific_settings.gecko.id`는 `{e8f7a9c2-4b1d-4f3e-8a5c-9b2d1e0f3a4c}`<br>Firefox Add-ons에 등록된 ID와 같아야 하고 바꾸지 않음 |
| Firefox 최소 버전 | `strict_min_version` `140.0`<br>140 미만 Firefox는 이 버전부터 업데이트를 받지 못함 |
| Firefox 데이터 수집 선언 | `data_collection_permissions.required`는 `none`<br>2-2-6에 따라 다른 서버로 데이터를 보내지 않음 |
| Chrome, Whale의 `browser_specific_settings` | 쓰지 않는 키<br>확장 관리 화면에 경고가 보일 수 있으나 동작에는 영향 없음 |

<br>

### 6-3 배포 전후 확인

| 시점 | 확인 |
|---|---|
| 제출 전 | 압축 해제 확장으로 5-1의 검증 케이스 전체 확인 |
| 반영 후 | 스토어에서 업데이트한 설치본으로 BOJP-QA-001 확인 |

<br>

### 6-4 되돌리기

되돌릴 때는 이전 버전의 내용을 버전 번호를 올려 다시 제출한다.
