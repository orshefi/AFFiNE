import { Input, PropertyValue } from '@affine/component';
import type { FilterParams } from '@affine/core/modules/collection-rules';
import { useI18n } from '@affine/i18n';
import { ChartPanelIcon } from '@blocksuite/icons/rc';
import { cssVar } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PlainTextDocGroupHeader } from '../explorer/docs-view/group-header';
import { StackProperty } from '../explorer/docs-view/stack-property';
import type { GroupHeaderProps } from '../explorer/types';
import { FilterValueMenu } from '../filter/filter-value-menu';
import type { PropertyValueProps } from '../properties/types';
import { searchTickers as searchTickersApi } from './ticker-adapter';

interface TickerData {
  symbol: string;
  name: string;
  exchange?: string;
  sector?: string;
  subsector?: string;
}

function parseTickerData(value: string): TickerData | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as TickerData;
  } catch {
    return null;
  }
}

function formatTicker(data: TickerData): string {
  return `${data.symbol} — ${data.name}`;
}

export const TickerValue = ({
  value,
  onChange,
  readonly,
}: PropertyValueProps) => {
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TickerData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useI18n();

  const tickerData = useMemo(() => parseTickerData(value), [value]);

  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchTickersApi(query)
        .then(results => {
          if (!cancelled) {
            setResults(results);
            setSelectedIndex(0);
          }
        })
        .catch(() => {});
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, editing]);

  useEffect(() => {
    if (editing) {
      // Focus on next tick so the input is rendered
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [editing]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!editing) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setEditing(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editing]);

  const handleSelect = useCallback(
    (ticker: TickerData) => {
      onChange(JSON.stringify(ticker));
      setEditing(false);
      setQuery('');
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      } else if (e.key === 'Escape') {
        setEditing(false);
        setQuery('');
      }
    },
    [results, selectedIndex, handleSelect]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!readonly) {
        setEditing(true);
        if (tickerData) {
          setQuery(tickerData.symbol);
        }
      }
    },
    [readonly, tickerData]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange('');
      setEditing(false);
      setQuery('');
    },
    [onChange]
  );

  return (
    <PropertyValue
      isEmpty={!tickerData}
      onClick={handleClick}
      readonly={readonly}
      style={{ position: 'relative' }}
    >
      {editing ? (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search ticker..."
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: cssVar('fontSm'),
              lineHeight: '22px',
              padding: '2px 0',
              color: 'inherit',
            }}
          />
          {results.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: -6,
                right: -6,
                zIndex: 1000,
                background: cssVarV2('layer/background/primary'),
                border: `1px solid ${cssVarV2('layer/insideBorder/border')}`,
                borderRadius: 8,
                boxShadow: cssVar('shadow2'),
                maxHeight: 240,
                overflowY: 'auto',
                marginTop: 4,
              }}
            >
              {results.map((ticker, index) => (
                <div
                  key={ticker.symbol}
                  onClick={e => {
                    e.stopPropagation();
                    handleSelect(ticker);
                  }}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: cssVar('fontSm'),
                    lineHeight: '20px',
                    background:
                      index === selectedIndex
                        ? cssVarV2('layer/background/hoverOverlay')
                        : 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <span>
                    <strong>{ticker.symbol}</strong>
                    <span
                      style={{
                        color: cssVarV2('text/secondary'),
                        marginLeft: 8,
                      }}
                    >
                      {ticker.name}
                    </span>
                  </span>
                  {ticker.exchange && (
                    <span
                      style={{
                        color: cssVarV2('text/tertiary'),
                        fontSize: cssVar('fontXs'),
                        flexShrink: 0,
                      }}
                    >
                      {ticker.exchange}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : tickerData ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: cssVar('fontSm'),
            lineHeight: '22px',
            width: '100%',
          }}
        >
          <span style={{ fontWeight: 600 }}>{tickerData.symbol}</span>
          <span style={{ color: cssVarV2('text/secondary') }}>
            — {tickerData.name}
          </span>
          {!readonly && (
            <span
              onClick={handleClear}
              style={{
                marginLeft: 'auto',
                cursor: 'pointer',
                color: cssVarV2('text/tertiary'),
                fontSize: cssVar('fontXs'),
                flexShrink: 0,
              }}
            >
              ✕
            </span>
          )}
        </div>
      ) : (
        <span
          style={{
            color: cssVar('placeholderColor'),
            fontSize: cssVar('fontSm'),
          }}
        >
          {t['com.affine.page-properties.property-value-placeholder']()}
        </span>
      )}
    </PropertyValue>
  );
};

export const TickerFilterValue = ({
  filter,
  isDraft,
  onDraftCompleted,
  onChange,
}: {
  filter: FilterParams;
  isDraft?: boolean;
  onDraftCompleted?: () => void;
  onChange?: (filter: FilterParams) => void;
}) => {
  const [tempValue, setTempValue] = useState(filter.value || '');
  const [valueMenuOpen, setValueMenuOpen] = useState(false);
  const t = useI18n();

  useEffect(() => {
    setTempValue(filter.value || '');
  }, [filter.value]);

  const submitTempValue = useCallback(() => {
    if (tempValue !== (filter.value || '')) {
      onChange?.({
        ...filter,
        value: tempValue,
      });
    }
  }, [filter, onChange, tempValue]);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Escape') return;
      submitTempValue();
      setValueMenuOpen(false);
      onDraftCompleted?.();
    },
    [submitTempValue, onDraftCompleted]
  );

  const handleInputEnter = useCallback(() => {
    submitTempValue();
    setValueMenuOpen(false);
    onDraftCompleted?.();
  }, [submitTempValue, onDraftCompleted]);

  useEffect(() => {
    if (
      isDraft &&
      (filter.method === 'is-not-empty' || filter.method === 'is-empty')
    ) {
      onDraftCompleted?.();
    }
  }, [isDraft, filter.method, onDraftCompleted]);

  return filter.method !== 'is-not-empty' && filter.method !== 'is-empty' ? (
    <FilterValueMenu
      isDraft={isDraft}
      rootOptions={{
        open: valueMenuOpen,
        onOpenChange: setValueMenuOpen,
        onClose: onDraftCompleted,
      }}
      contentOptions={{
        onPointerDownOutside: submitTempValue,
      }}
      items={
        <Input
          inputStyle={{
            fontSize: cssVar('fontBase'),
          }}
          autoFocus
          autoSelect
          value={tempValue}
          onChange={(value: string) => {
            setTempValue(value);
          }}
          onEnter={handleInputEnter}
          onKeyDown={handleInputKeyDown}
          style={{ height: 34, borderRadius: 4 }}
        />
      }
    >
      {filter.value ? (
        <span>{filter.value}</span>
      ) : (
        <span style={{ color: cssVarV2('text/placeholder') }}>
          {t['com.affine.filter.empty']()}
        </span>
      )}
    </FilterValueMenu>
  ) : null;
};

export const TickerDocListProperty = ({ value }: { value: string }) => {
  const tickerData = useMemo(() => parseTickerData(value), [value]);

  if (!tickerData) {
    return null;
  }

  return (
    <StackProperty icon={<ChartPanelIcon />}>{tickerData.symbol}</StackProperty>
  );
};

export const TickerGroupHeader = ({ groupId, docCount }: GroupHeaderProps) => {
  const tickerData = useMemo(() => parseTickerData(groupId), [groupId]);
  const text = tickerData ? formatTicker(tickerData) : groupId || 'No Ticker';
  return (
    <PlainTextDocGroupHeader groupId={groupId} docCount={docCount}>
      {text}
    </PlainTextDocGroupHeader>
  );
};
