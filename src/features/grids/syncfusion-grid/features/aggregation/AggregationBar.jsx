import React from "react";
import {useIntl} from "react-intl";

const formatCompactValue = (val, useCompact = true) => {
    if (typeof val !== "number") return val;

    const absVal = Math.abs(val);

    if (!useCompact || absVal < 1000) {
        return !Number.isInteger(val) ? val.toFixed(2) : val.toString();
    }

    if (absVal >= 1000000000) {
        return (val / 1000000000).toFixed(1) + "B";
    } else if (absVal >= 1000000) {
        return (val / 1000000).toFixed(1) + "M";
    } else if (absVal >= 1000) {
        return (val / 1000).toFixed(1) + "K";
    }

    return val.toString();
};

const getFullValue = (val) => {
    if (typeof val !== "number") return val;
    return !Number.isInteger(val) ? val.toFixed(2) : val.toString();
};

const AggregationBar = React.forwardRef(
    (
        {
            columns,
            aggregates,
            pageSize,
            total,
            columnWidths,
            gridContentWidth,
            minWidth,
        },
        ref
    ) => {
        const intl = useIntl();
        const hasMultiplePages = total > pageSize;
        const aggMap = Object.fromEntries(aggregates.map((a) => [a.field, a]));

        const getAggLabel = (type) => {
            switch (type) {
                case "sum":
                    return intl.formatMessage({id: "txtSuma"});
                case "avg":
                    return intl.formatMessage({id: "txtSrednia"});
                case "min":
                    return intl.formatMessage({id: "txtMinimum"});
                case "max":
                    return intl.formatMessage({id: "txtMaksimum"});
                default:
                    return type;
            }
        };

        // If no column widths are available yet, use defaults to ensure visibility
        const hasColumnWidths = columnWidths && columnWidths.length > 0;
        const fallbackWidth = hasColumnWidths ? undefined : "100%";

        return (
            <div
                ref={ref}
                style={{
                    width: gridContentWidth ? `${gridContentWidth}px` : fallbackWidth,
                    overflow: "hidden",
                    backgroundColor: "rgb(var(--color-background-default))",
                    borderTop: "2px solid rgb(var(--color-border))",
                    color: "rgb(var(--color-text-grey-base))",
                    padding: "8px 6px",
                    fontWeight: 500,
                    fontSize: 14,
                    minHeight: 60,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        minWidth:
                            minWidth && hasColumnWidths ? `${minWidth}px` : "max-content",
                        whiteSpace: "nowrap",
                        width: hasColumnWidths ? undefined : "max-content",
                    }}
                >
                    {columns.map((col, idx) => {
                        const agg = aggMap[col.field];
                        const cellWidth =
                            hasColumnWidths && columnWidths[idx]
                                ? `${columnWidths[idx]}px`
                                : undefined;

                        if (!agg)
                            return (
                                <div
                                    key={col.field}
                                    style={{
                                        width: cellWidth,
                                        minWidth: 60,
                                        flex: hasColumnWidths ? undefined : "1",
                                        textAlign: col.textAlign || "right",
                                        padding: "6px 8px",
                                        boxSizing: "border-box",
                                        margin: "0 2px",
                                        minHeight: "44px",
                                    }}
                                />
                            );
                        const types = Object.keys(agg.aggregates);
                        const tooltip = types
                            .map((type) => {
                                const {page, total} = agg.aggregates[type];
                                const label = getAggLabel(type);
                                if (hasMultiplePages) {
                                    const pageText = intl.formatMessage({id: "txtStrona"});
                                    const totalText = intl.formatMessage({id: "txtLacznie"});
                                    return `${label}: ${pageText} ${getFullValue(
                                        page
                                    )} / ${totalText} ${getFullValue(total)}`;
                                } else {
                                    return `${label}: ${getFullValue(total)}`;
                                }
                            })
                            .join("\n");
                        return (
                            <div
                                key={col.field}
                                style={{
                                    width: cellWidth,
                                    minWidth: 60,
                                    flex: hasColumnWidths ? undefined : "1",
                                    textAlign: col.textAlign || "right",
                                    padding: "6px 8px",
                                    boxSizing: "border-box",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    borderLeft:
                                        idx > 0 ? "1px solid rgb(var(--color-border-light))" : "none",
                                    backgroundColor: "rgba(var(--color-background-inverted), 0.08)",
                                    border: "1px solid rgb(var(--color-border))",
                                    borderRadius: "4px",
                                    margin: "0 2px",
                                    position: "relative",
                                }}
                                title={tooltip}
                            >
                                {/* Column identifier header */}
                                <div
                                    style={{
                                        fontSize: "10px",
                                        color: "rgb(var(--color-text-light-grey-base))",
                                        marginBottom: "3px",
                                        fontWeight: "normal",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        maxHeight: "12px",
                                        lineHeight: "1",
                                    }}
                                    title={col.headerText || col.field}
                                >
                                    {col.headerText || col.field}
                                </div>

                                {/* Aggregation values */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "2px",
                                        justifyContent:
                                            col.textAlign === "left" ? "flex-start" : "flex-end",
                                        alignItems: "flex-start",
                                    }}
                                >
                                    {types.map((type) => {
                                        const {page, total} = agg.aggregates[type];
                                        const compactTotal = formatCompactValue(total);
                                        const compactPage = hasMultiplePages
                                            ? formatCompactValue(page)
                                            : null;
                                        const fullTotal = getFullValue(total);
                                        const fullPage = hasMultiplePages
                                            ? getFullValue(page)
                                            : null;

                                        const needsCompact =
                                            fullTotal.length > 8 || (fullPage && fullPage.length > 6);

                                        return (
                                            <span
                                                key={type}
                                                style={{
                                                    display: "inline-block",
                                                    backgroundColor: "rgba(var(--color-background-inverted), 0.12)",
                                                    border: "1px solid rgba(var(--color-border), 0.7)",
                                                    borderRadius: "3px",
                                                    padding: "2px 4px",
                                                    fontSize: needsCompact ? "10px" : "11px",
                                                    color: "rgb(var(--color-text-grey-base))",
                                                    whiteSpace: "nowrap",
                                                    maxWidth: "80px",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    cursor: "help",
                                                }}
                                                title={
                                                    hasMultiplePages
                                                        ? `${getAggLabel(type)}: ${intl.formatMessage({
                                                            id: "txtStrona",
                                                        })} ${fullPage} / ${intl.formatMessage({
                                                            id: "txtLacznie",
                                                        })} ${fullTotal}`
                                                        : `${getAggLabel(type)}: ${fullTotal}`
                                                }
                                            >
                        <div
                            style={{
                                color: "rgb(var(--color-text-light-grey-base))",
                                fontSize: needsCompact ? "9px" : "10px",
                                lineHeight: "1",
                            }}
                        >
                          {getAggLabel(type)}
                        </div>
                        <div
                            style={{
                                fontWeight: "bold",
                                color: "rgb(var(--color-text-grey-base))",
                                fontSize: needsCompact ? "10px" : "11px",
                                lineHeight: "1.1",
                                marginTop: "1px",
                            }}
                        >
                          {hasMultiplePages && (
                              <div
                                  style={{
                                      fontSize: needsCompact ? "9px" : "10px",
                                      fontWeight: "normal",
                                  }}
                              >
                                  {needsCompact ? compactPage : fullPage}
                              </div>
                          )}
                            <div>{needsCompact ? compactTotal : fullTotal}</div>
                        </div>
                      </span>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
);

AggregationBar.displayName = 'AggregationBar';

export default AggregationBar;
