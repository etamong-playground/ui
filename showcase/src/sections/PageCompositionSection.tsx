import {
  AppInfoSection,
  PageContainer,
  PageHeader,
  SettingsGroup,
  SettingsRow,
  useT,
} from "@etamong-playground/ui";
import { FeatureTag } from "../FeatureTag";

export function PageCompositionSection() {
  const t = useT();

  return (
    <div className="sc-section">
      <div className="sc-prose">
        <h2>{t("section.composition")}</h2>
        <p>
          Restrained page measures and type hierarchy for feeds, settings, and
          content-first screens. The module owns spacing and responsive
          composition while each app keeps its product-specific cards and controls.
        </p>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">
          <span>Typography hierarchy</span>
          <FeatureTag id="page-composition" />
        </div>
        <div className="sc-type-samples">
          <span className="etu-type-display">Display</span>
          <span className="etu-type-page-title">Page title</span>
          <span className="etu-type-section-title">Section title</span>
          <span className="etu-type-body">Body text stays readable and quiet.</span>
          <span className="etu-type-metadata">Metadata · 8 candidates</span>
        </div>
      </div>

      <div className="sc-card" data-testid="composition-single">
        <div className="sc-card-header">Single-item content state</div>
        <PageContainer as="div" measure="wide" className="sc-composition-frame">
          <PageHeader
            kicker="둘러보기"
            title="참여할 투표를 골라주세요"
            description="이미지와 설명을 살펴본 뒤 투표를 선택합니다."
            headingLevel={2}
            actions={<><button className="sc-btn" type="button">새 투표 만들기</button><button className="sc-btn" type="button">초대받은 투표 확인</button></>}
          />
          <article className="sc-vote-preview">
            <div className="sc-vote-preview-image" role="img" aria-label="Campaign image preview">
              <span>THE CHUNG</span>
            </div>
            <div className="sc-vote-preview-copy">
              <span className="etu-type-metadata">진행 중</span>
              <h3>함께 고르는 살아 숨 쉬는 순간</h3>
              <p>여덟 개의 게시물을 한 화면에서 보고 선택하는 이미지 중심 투표입니다.</p>
              <span className="etu-type-metadata">8개 후보</span>
            </div>
          </article>
        </PageContainer>
      </div>

      <div className="sc-card" data-testid="composition-settings">
        <div className="sc-card-header">Compact settings state</div>
        <PageContainer as="div" measure="narrow" className="sc-composition-frame">
          <PageHeader
            density="compact"
            kicker="개인 설정"
            title="설정"
            description="자주 바꾸는 항목만 간결하게 관리합니다."
            headingLevel={2}
          />
          <SettingsGroup heading="환경">
            <SettingsRow
              label="언어"
              description="이 기기에서 사용할 표시 언어"
              action={(accessibility) => <select className="sc-select" defaultValue="ko" {...accessibility}><option value="ko">한국어</option><option value="en">English</option></select>}
            />
            <SettingsRow
              label="알림"
              description="투표가 종료되면 알려드립니다."
              action={(accessibility) => <button className="sc-btn" type="button" {...accessibility}>켜짐</button>}
            />
          </SettingsGroup>
          <AppInfoSection heading="앱 정보" appVersion="alpha" />
          <SettingsGroup
            heading="계정"
            description="계정 삭제는 다른 설정과 분리합니다."
            tone="danger"
          >
            <SettingsRow
              label="계정 삭제"
              description="요청 후 30일 동안 취소할 수 있습니다."
              action={(accessibility) => <button className="sc-btn sc-btn--err" type="button" {...accessibility}>삭제 요청</button>}
            />
          </SettingsGroup>
        </PageContainer>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">Theme contract</div>
        <p className="sc-card-body">
          Theme selection is opt-in. Light-only apps omit the control. A dark
          option requires an intentionally reviewed dark composition, not an
          unchecked token inversion.
        </p>
      </div>
    </div>
  );
}
