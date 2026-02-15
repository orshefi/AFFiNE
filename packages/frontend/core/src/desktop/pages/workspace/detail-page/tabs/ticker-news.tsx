import { DocService } from '@affine/core/modules/doc';
import { WorkspacePropertyService } from '@affine/core/modules/workspace-property';
import { useLiveData, useService } from '@toeverything/infra';
import { cssVar } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import { useMemo } from 'react';

interface TickerData {
  symbol: string;
  name: string;
  exchange?: string;
  sector?: string;
}

interface NewsArticle {
  title: string;
  source: string;
  date: string;
  summary: string;
}

const MOCK_NEWS: Record<string, NewsArticle[]> = {
  AAPL: [
    {
      title: 'Apple Reports Record Q4 Revenue Driven by iPhone Sales',
      source: 'Reuters',
      date: '2025-01-15',
      summary:
        'Apple Inc. reported fourth-quarter revenue of $94.9 billion, beating analyst expectations as iPhone sales surged 6% year-over-year.',
    },
    {
      title: 'Apple Vision Pro Expands to 10 New Markets',
      source: 'Bloomberg',
      date: '2025-01-12',
      summary:
        'Apple announced the expansion of Vision Pro availability to 10 additional countries, signaling growing confidence in the spatial computing platform.',
    },
    {
      title: 'Apple Increases Services Revenue Guidance',
      source: 'CNBC',
      date: '2025-01-10',
      summary:
        'The tech giant raised its services revenue outlook, citing strong subscription growth across Apple TV+, iCloud, and the App Store.',
    },
  ],
  MSFT: [
    {
      title: 'Microsoft Azure Revenue Grows 29% in Latest Quarter',
      source: 'Bloomberg',
      date: '2025-01-14',
      summary:
        'Microsoft cloud division continues to outpace competitors with Azure revenue growing 29%, driven by AI workload adoption.',
    },
    {
      title: 'Microsoft Copilot Reaches 50 Million Enterprise Users',
      source: 'TechCrunch',
      date: '2025-01-11',
      summary:
        'Microsoft announced that its AI-powered Copilot assistant has reached 50 million enterprise users across Office 365 and GitHub.',
    },
  ],
  GOOGL: [
    {
      title: 'Alphabet Ad Revenue Surges on AI-Enhanced Search',
      source: 'Wall Street Journal',
      date: '2025-01-13',
      summary:
        'Google parent Alphabet reported a 12% increase in advertising revenue as AI-powered search features drove higher engagement and click-through rates.',
    },
    {
      title: 'Google DeepMind Unveils Next-Gen AI Model',
      source: 'The Verge',
      date: '2025-01-09',
      summary:
        'Google DeepMind announced its latest foundation model, claiming significant improvements in reasoning and multimodal understanding.',
    },
  ],
  TSLA: [
    {
      title: 'Tesla Delivers Record 500K Vehicles in Q4',
      source: 'Reuters',
      date: '2025-01-14',
      summary:
        'Tesla reported record quarterly deliveries of over 500,000 vehicles, driven by strong demand for the refreshed Model 3 and Model Y.',
    },
    {
      title: 'Tesla FSD V13 Receives Regulatory Approval in Europe',
      source: 'Financial Times',
      date: '2025-01-08',
      summary:
        'Tesla Full Self-Driving version 13 has received conditional approval from EU regulators, marking a major milestone for autonomous driving in Europe.',
    },
  ],
  NVDA: [
    {
      title: 'NVIDIA Data Center Revenue Hits $30B Quarterly Record',
      source: 'Bloomberg',
      date: '2025-01-15',
      summary:
        'NVIDIA reported data center revenue of $30 billion for the quarter, fueled by unprecedented demand for its Blackwell GPU architecture.',
    },
    {
      title: 'NVIDIA Announces Next-Gen Rubin Architecture',
      source: 'AnandTech',
      date: '2025-01-10',
      summary:
        'At a special event, NVIDIA previewed its Rubin GPU architecture slated for 2026, promising 4x performance gains for AI training workloads.',
    },
    {
      title: 'NVIDIA Partners with Leading Automakers on AV Chips',
      source: 'CNBC',
      date: '2025-01-07',
      summary:
        'NVIDIA expanded its DRIVE platform partnerships with three major automakers for next-generation autonomous vehicle computing.',
    },
  ],
};

function getNewsForTicker(ticker: TickerData): NewsArticle[] {
  if (MOCK_NEWS[ticker.symbol]) {
    return MOCK_NEWS[ticker.symbol];
  }
  return [
    {
      title: `${ticker.name} Reports Strong Quarterly Results`,
      source: 'Reuters',
      date: '2025-01-15',
      summary: `${ticker.name} (${ticker.symbol}) delivered better-than-expected earnings this quarter, with revenue growth across all business segments.`,
    },
    {
      title: `Analysts Upgrade ${ticker.symbol} on Positive Outlook`,
      source: 'Bloomberg',
      date: '2025-01-12',
      summary: `Multiple analysts have upgraded ${ticker.name} citing strong fundamentals and favorable market conditions in the ${ticker.sector ?? 'industry'} sector.`,
    },
  ];
}

function parseTickerData(value: string | null | undefined): TickerData | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as TickerData;
  } catch {
    return null;
  }
}

export function useDocTickers(): TickerData[] {
  const workspacePropertyService = useService(WorkspacePropertyService);
  const properties = useLiveData(workspacePropertyService.properties$);
  const doc = useService(DocService).doc;

  const tickerPropertyIds = useMemo(
    () =>
      properties
        .filter(p => p.type === 'ticker' && !p.isDeleted)
        .map(p => p.id),
    [properties]
  );

  const prop0 = useLiveData(
    doc.customProperty$(tickerPropertyIds[0] ?? '__none__')
  );
  const prop1 = useLiveData(
    doc.customProperty$(tickerPropertyIds[1] ?? '__none__')
  );
  const prop2 = useLiveData(
    doc.customProperty$(tickerPropertyIds[2] ?? '__none__')
  );
  const prop3 = useLiveData(
    doc.customProperty$(tickerPropertyIds[3] ?? '__none__')
  );

  return useMemo(() => {
    const values = [prop0, prop1, prop2, prop3];
    const tickers: TickerData[] = [];
    for (let i = 0; i < tickerPropertyIds.length && i < 4; i++) {
      const parsed = parseTickerData(values[i]);
      if (parsed) {
        tickers.push(parsed);
      }
    }
    return tickers;
  }, [tickerPropertyIds, prop0, prop1, prop2, prop3]);
}

export const TickerNewsPanel = () => {
  const tickers = useDocTickers();

  if (tickers.length === 0) {
    return (
      <div
        style={{
          padding: 16,
          color: cssVarV2('text/secondary'),
          fontSize: cssVar('fontSm'),
          textAlign: 'center',
        }}
      >
        No ticker data available.
      </div>
    );
  }

  return (
    <div
      style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      {tickers.map(ticker => {
        const articles = getNewsForTicker(ticker);
        return (
          <div key={ticker.symbol}>
            <div
              style={{
                fontSize: cssVar('fontBase'),
                fontWeight: 600,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>{ticker.symbol}</span>
              <span
                style={{
                  color: cssVarV2('text/secondary'),
                  fontWeight: 400,
                  fontSize: cssVar('fontSm'),
                }}
              >
                {ticker.name}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {articles.map((article, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: `1px solid ${cssVarV2('layer/insideBorder/border')}`,
                    background: cssVarV2('layer/background/primary'),
                  }}
                >
                  <div
                    style={{
                      fontSize: cssVar('fontSm'),
                      fontWeight: 600,
                      lineHeight: '20px',
                      marginBottom: 4,
                    }}
                  >
                    {article.title}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      fontSize: cssVar('fontXs'),
                      color: cssVarV2('text/tertiary'),
                      marginBottom: 8,
                    }}
                  >
                    <span>{article.source}</span>
                    <span>{article.date}</span>
                  </div>
                  <div
                    style={{
                      fontSize: cssVar('fontXs'),
                      lineHeight: '18px',
                      color: cssVarV2('text/secondary'),
                    }}
                  >
                    {article.summary}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
