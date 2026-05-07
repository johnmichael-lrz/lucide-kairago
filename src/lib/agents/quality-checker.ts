import type { AgentState } from './state'

const VALID_RISK_LEVELS = ['SAFE', 'MODERATE RISK', 'EVACUATE NOW']
const VALID_CONFIDENCE = ['HIGH', 'MODERATE', 'LOW']
const REQUIRED_DISCLAIMER =
  'This bulletin supplements but does not replace official NDRRMC and LGU advisories'

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export async function qualityCheckerNode(state: AgentState): Promise<Partial<AgentState>> {
  const { bulletin_draft, risk_level: calculatedRiskLevel, retry_count = 0 } = state
  const issues: string[] = []

  if (!bulletin_draft || typeof bulletin_draft !== 'object') {
    return {
      quality_check_result: { passed: false, issues: ['Bulletin draft is missing or invalid'] },
      retry_count: retry_count + 1,
    }
  }

  const draftRiskLevel = bulletin_draft.risk_level as string | undefined
  const recommendedAction = bulletin_draft.recommended_action as string | undefined
  const bulletinText = bulletin_draft.bulletin_text as string | undefined
  const disclaimer = bulletin_draft.disclaimer as string | undefined
  const confidence = bulletin_draft.confidence as string | undefined

  if (!VALID_RISK_LEVELS.includes(draftRiskLevel ?? '')) {
    issues.push(`risk_level "${draftRiskLevel}" is not a valid risk level`)
  } else if (draftRiskLevel !== calculatedRiskLevel) {
    issues.push(
      `risk_level "${draftRiskLevel}" does not match calculated "${calculatedRiskLevel}"`,
    )
  }

  if (!recommendedAction) {
    issues.push('recommended_action is missing')
  } else if (countWords(recommendedAction) > 8) {
    issues.push(
      `recommended_action has ${countWords(recommendedAction)} words (max 8): "${recommendedAction}"`,
    )
  }

  if (!bulletinText) {
    issues.push('bulletin_text is missing')
  } else if (!/your community/i.test(bulletinText)) {
    issues.push('bulletin_text must contain "your community" as the subject')
  }

  if (!disclaimer) {
    issues.push('disclaimer is missing')
  } else if (!disclaimer.includes(REQUIRED_DISCLAIMER)) {
    issues.push('disclaimer does not match the required exact text')
  }

  if (!VALID_CONFIDENCE.includes(confidence ?? '')) {
    issues.push(`confidence "${confidence}" must be HIGH, MODERATE, or LOW`)
  }

  if (issues.length === 0) {
    return {
      quality_check_result: { passed: true, issues: [] },
      retry_count,
    }
  }

  const newRetryCount = retry_count + 1

  // Force-approve after 2 retries to prevent infinite loops
  if (newRetryCount >= 2) {
    return {
      quality_check_result: { passed: false, issues },
      retry_count: newRetryCount,
    }
  }

  return {
    quality_check_result: { passed: false, issues },
    retry_count: newRetryCount,
  }
}
