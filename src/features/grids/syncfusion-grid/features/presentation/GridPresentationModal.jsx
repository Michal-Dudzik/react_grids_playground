import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Button, Checkbox, Empty, Input, Select} from "antd";
import {useIntl} from "react-intl";
import {DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors} from "@dnd-kit/core";
import {arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy} from "@dnd-kit/sortable";
import {restrictToVerticalAxis} from "@dnd-kit/modifiers";
import {CSS} from "@dnd-kit/utilities";
import {LuCopy, LuGripVertical, LuPaintbrush, LuPlus, LuTrash2} from "react-icons/lu";
import BaseModal from "../../../base-modal/BaseModal.jsx";
import {PRESENTATION_TEMPLATE_DEFINITIONS} from "./presentationRegistry.jsx";
import {
    createEmptyPresentationRule,
    needsCompareValue,
    normalizePresentationConfig,
    PRESENTATION_CONDITION_OPTIONS,
    PRESENTATION_FONT_WEIGHT_OPTIONS,
    PRESENTATION_KIND_OPTIONS,
    PRESENTATION_RULE_KIND_DECORATION,
    PRESENTATION_RULE_KIND_TEMPLATE,
    PRESENTATION_RULE_SOURCE_DEFAULT,
    PRESENTATION_RULE_SOURCE_USER,
    PRESENTATION_TARGET_OPTIONS,
    PRESENTATION_TEXT_ALIGN_OPTIONS,
} from "./presentationSchema.js";

function sortRulesForDisplay(rules = []) {
    return [...rules].sort((left, right) => (right.priority || 0) - (left.priority || 0));
}

const normalizedHexColorCache = new Map();

const DragHandleContext = React.createContext(null);

function RuleDragHandle() {
    const dragHandleProps = React.useContext(DragHandleContext);

    if (!dragHandleProps) {
        return null;
    }

    const {setActivatorNodeRef, listeners} = dragHandleProps;

    return (
        <button
            type="button"
            ref={setActivatorNodeRef}
            {...listeners}
            className="flex h-8 w-8 items-center justify-center rounded-md text-skin-muted hover:bg-skin-base/5"
        >
            <LuGripVertical/>
        </button>
    );
}

function SortableRuleCard({ruleId, children}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({id: ruleId});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        ...(isDragging ? {position: "relative", zIndex: 10} : {}),
    };

    return (
        <DragHandleContext.Provider value={{setActivatorNodeRef, listeners}}>
            <div ref={setNodeRef} style={style} {...attributes}>
                {children}
            </div>
        </DragHandleContext.Provider>
    );
}

function normalizeHexColor(value) {
    if (!value || typeof value !== "string") {
        return "#000000";
    }

    const trimmedValue = value.trim();

    if (normalizedHexColorCache.has(trimmedValue)) {
        return normalizedHexColorCache.get(trimmedValue);
    }

    const shortHexMatch = trimmedValue.match(/^#([0-9a-f]{3})$/i);
    if (shortHexMatch) {
        const [r, g, b] = shortHexMatch[1].split("");
        const normalizedColor = `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
        normalizedHexColorCache.set(trimmedValue, normalizedColor);
        return normalizedColor;
    }

    const hexMatch = trimmedValue.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
    if (hexMatch) {
        const normalizedColor = `#${hexMatch[1].toLowerCase()}`;
        normalizedHexColorCache.set(trimmedValue, normalizedColor);
        return normalizedColor;
    }

    if (typeof document === "undefined") {
        normalizedHexColorCache.set(trimmedValue, "#000000");
        return "#000000";
    }

    const probe = document.createElement("div");
    probe.style.color = "";
    probe.style.color = trimmedValue;

    const normalizedValue = probe.style.color;
    if (!normalizedValue) {
        normalizedHexColorCache.set(trimmedValue, "#000000");
        return "#000000";
    }

    const rgbMatch = normalizedValue.match(/^rgb\(\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\s*\)$/i);
    if (!rgbMatch) {
        normalizedHexColorCache.set(trimmedValue, "#000000");
        return "#000000";
    }

    const normalizedColor = `#${rgbMatch
        .slice(1, 4)
        .map((part) => Number(part).toString(16).padStart(2, "0"))
        .join("")}`;

    normalizedHexColorCache.set(trimmedValue, normalizedColor);
    return normalizedColor;
}

function ColorInput({value, onChange}) {
    return (
        <input
            type="color"
            value={normalizeHexColor(value)}
            onChange={(event) => onChange(event.target.value)}
            className="h-10 w-full cursor-pointer rounded border border-skin-border bg-transparent"
        />
    );
}

export default function GridPresentationModal({
    open,
    onClose,
    columns = [],
    value,
    onSave,
    onReset,
}) {
    const intl = useIntl();
    const availableColumns = useMemo(() => columns
        .filter(column => column?.field)
        .map(column => ({
            value: column.field,
            label: column.headerText || column.field,
        })), [columns]);

    const [draftConfig, setDraftConfig] = useState(() => {
        const normalizedConfig = normalizePresentationConfig(value);

        return {
            ...normalizedConfig,
            rules: sortRulesForDisplay(normalizedConfig.rules),
        };
    });

    const conditionOptions = useMemo(() => [
        {value: "", label: intl.formatMessage({id: "txtBrak", defaultMessage: "None"})},
        ...availableColumns,
    ], [availableColumns, intl]);

    const fieldOptions = useMemo(() => [
        {value: "", label: intl.formatMessage({id: "txtWszystkie", defaultMessage: "All"})},
        ...availableColumns,
    ], [availableColumns, intl]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 1,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (open) {
            const normalizedConfig = normalizePresentationConfig(value);
            setDraftConfig({
                ...normalizedConfig,
                rules: sortRulesForDisplay(normalizedConfig.rules),
            });
        }
    }, [open, value]);

    const handleDragEnd = useCallback((event) => {
        const {active, over} = event;

        if (!over || active.id === over.id) {
            return;
        }

        setDraftConfig((currentConfig) => {
            const oldIndex = currentConfig.rules.findIndex(rule => rule.id === active.id);
            const newIndex = currentConfig.rules.findIndex(rule => rule.id === over.id);

            return {
                ...currentConfig,
                rules: arrayMove(currentConfig.rules, oldIndex, newIndex),
            };
        });
    }, []);

    const updateRule = (ruleId, updater) => {
        setDraftConfig((currentConfig) => ({
            ...currentConfig,
            rules: currentConfig.rules.map((rule) => (
                rule.id === ruleId
                    ? updater(rule)
                    : rule
            )),
        }));
    };

    const addRule = () => {
        setDraftConfig((currentConfig) => ({
            ...currentConfig,
            rules: [
                ...currentConfig.rules,
                createEmptyPresentationRule(availableColumns[0]?.value || ""),
            ],
        }));
    };

    const duplicateRule = (ruleId) => {
        setDraftConfig((prev) => {
            const sourceRule = prev.rules.find(rule => rule.id === ruleId);
            if (!sourceRule) {
                return prev;
            }

            const emptyRule = createEmptyPresentationRule(
                sourceRule.field || "",
                PRESENTATION_RULE_SOURCE_USER
            );
            const duplicatedRule = {
                ...emptyRule,
                ...sourceRule,
                id: emptyRule.id,
                source: PRESENTATION_RULE_SOURCE_USER,
                label: sourceRule.label ? `${sourceRule.label} copy` : "",
            };

            return {
                ...prev,
                rules: [...prev.rules, duplicatedRule],
            };
        });
    };

    const deleteRule = (ruleId) => {
        setDraftConfig((currentConfig) => ({
            ...currentConfig,
            rules: currentConfig.rules.filter(rule => rule.id !== ruleId),
        }));
    };

    const handleSave = () => {
        const updatedConfig = {
            ...draftConfig,
            rules: draftConfig.rules.map((rule, index) => ({
                ...rule,
                priority: draftConfig.rules.length - index,
            })),
        };

        onSave(updatedConfig);
    };

    const footer = [
        <Button key="reset" onClick={onReset}>
            {intl.formatMessage({
                id: "txtResetujPrezentacjeGridu",
                defaultMessage: "Reset",
            })}
        </Button>,
        <Button key="cancel" onClick={onClose}>
            {intl.formatMessage({
                id: "txtAnuluj",
                defaultMessage: "Cancel",
            })}
        </Button>,
        <Button
            key="save"
            type="primary"
            onClick={handleSave}
        >
            {intl.formatMessage({
                id: "txtZapisz",
                defaultMessage: "Save",
            })}
        </Button>,
    ];

    return (
        <BaseModal
            title={intl.formatMessage({
                id: "txtRegulyPrezentacjiGridu",
                defaultMessage: "Rules",
            })}
            visible={open}
            onClose={onClose}
            onSubmit={handleSave}
            showSubmit={false}
            showCancel={false}
            width={980}
            maxBodyHeight="70vh"
            customFooter={footer}
        >
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-skin-muted">
                        {intl.formatMessage({
                            id: "txtKolejnoscRegulPrezentacji",
                            defaultMessage: "Drag rules to reorder them. The top rule has the highest priority.",
                        })}
                    </div>
                    <Button type="primary" icon={<LuPlus/>} onClick={addRule}>
                        {intl.formatMessage({
                            id: "txtDodajRegulePrezentacji",
                            defaultMessage: "Add rule",
                        })}
                    </Button>
                </div>

                {draftConfig.rules.length === 0 && (
                    <Empty
                        description={intl.formatMessage({
                            id: "txtBrakRegulPrezentacji",
                            defaultMessage: "No rules defined yet.",
                        })}
                    />
                )}

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis]}
                    onDragEnd={handleDragEnd}
                >
                <SortableContext
                    items={draftConfig.rules.map(rule => rule.id)}
                    strategy={verticalListSortingStrategy}
                >
                <div className="space-y-4">
                    {draftConfig.rules.map((rule, index) => {
                        const isDefaultRule = rule.source === PRESENTATION_RULE_SOURCE_DEFAULT;

                        return (
                            <SortableRuleCard key={rule.id} ruleId={rule.id}>
                            <div className="rounded-lg border border-skin-border bg-skin-fill p-4">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-skin-accent/10 text-sm font-semibold text-skin-base">
                                            {index + 1}
                                        </div>
                                        <Input
                                            value={rule.label}
                                            onChange={(event) => updateRule(rule.id, currentRule => ({
                                                ...currentRule,
                                                label: event.target.value,
                                            }))}
                                            placeholder={intl.formatMessage({
                                                id: "txtNazwaRegulyPrezentacji",
                                                defaultMessage: "Rule name",
                                            })}
                                            style={{width: 240}}
                                        />
                                        {isDefaultRule && (
                                        <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700">
                                            {intl.formatMessage({
                                                id: "txtRegulaDomyslna",
                                                defaultMessage: "Default rule",
                                            })}
                                        </span>
                                        )}
                                        <Checkbox
                                            checked={rule.enabled !== false}
                                            onChange={(event) => updateRule(rule.id, currentRule => ({
                                                ...currentRule,
                                                enabled: event.target.checked,
                                            }))}
                                        >
                                            {intl.formatMessage({
                                                id: "txtAktywna",
                                                defaultMessage: "Enabled",
                                            })}
                                        </Checkbox>
                                    </div>
                                    <div className="flex items-center self-center gap-2">
                                        <Button
                                            icon={<LuCopy/>}
                                            onClick={() => duplicateRule(rule.id)}
                                        />
                                        <Button
                                            danger
                                            icon={<LuTrash2/>}
                                            disabled={isDefaultRule}
                                            onClick={() => deleteRule(rule.id)}
                                        />
                                        <RuleDragHandle/>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                                    <label className="flex flex-col gap-1 text-sm">
                                        <span className="font-medium">
                                            {intl.formatMessage({
                                                id: "txtRodzaj",
                                                defaultMessage: "Kind",
                                            })}
                                        </span>
                                        <Select
                                            value={rule.kind}
                                            options={PRESENTATION_KIND_OPTIONS}
                                            onChange={(nextKind) => updateRule(rule.id, currentRule => ({
                                                ...currentRule,
                                                kind: nextKind,
                                                target: nextKind === PRESENTATION_RULE_KIND_TEMPLATE
                                                    ? "cell"
                                                    : currentRule.target,
                                            }))}
                                        />
                                    </label>

                                    {rule.kind === PRESENTATION_RULE_KIND_DECORATION && (
                                        <label className="flex flex-col gap-1 text-sm">
                                            <span className="font-medium">
                                                {intl.formatMessage({
                                                    id: "txtZakres",
                                                    defaultMessage: "Target",
                                                })}
                                            </span>
                                            <Select
                                                value={rule.target}
                                                options={PRESENTATION_TARGET_OPTIONS}
                                                onChange={(nextTarget) => updateRule(rule.id, currentRule => ({
                                                    ...currentRule,
                                                    target: nextTarget,
                                                }))}
                                            />
                                        </label>
                                    )}

                                    <label className="flex flex-col gap-1 text-sm">
                                        <span className="font-medium">
                                            {intl.formatMessage({
                                                id: "txtKolumna",
                                                defaultMessage: "Column",
                                            })}
                                        </span>
                                        <Select
                                            value={rule.field || ""}
                                            options={fieldOptions}
                                            onChange={(nextField) => updateRule(rule.id, currentRule => ({
                                                ...currentRule,
                                                field: nextField,
                                                conditionField: currentRule.conditionField || nextField,
                                            }))}
                                        />
                                    </label>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
                                    <label className="flex flex-col gap-1 text-sm">
                                        <span className="font-medium">
                                            {intl.formatMessage({
                                                id: "txtPoleWarunku",
                                                defaultMessage: "Condition field",
                                            })}
                                        </span>
                                        <Select
                                            value={rule.conditionField || ""}
                                            options={conditionOptions}
                                            onChange={(nextField) => updateRule(rule.id, currentRule => ({
                                                ...currentRule,
                                                conditionField: nextField,
                                            }))}
                                        />
                                    </label>

                                    <label className="flex flex-col gap-1 text-sm">
                                        <span className="font-medium">
                                            {intl.formatMessage({
                                                id: "txtWarunek",
                                                defaultMessage: "Condition",
                                            })}
                                        </span>
                                        <Select
                                            value={rule.operator}
                                            options={PRESENTATION_CONDITION_OPTIONS}
                                            onChange={(nextOperator) => updateRule(rule.id, currentRule => ({
                                                ...currentRule,
                                                operator: nextOperator,
                                                compareValue: needsCompareValue(nextOperator)
                                                    ? currentRule.compareValue
                                                    : "",
                                            }))}
                                        />
                                    </label>

                                    {needsCompareValue(rule.operator) && (
                                        <label className="flex flex-col gap-1 text-sm">
                                            <span className="font-medium">
                                                {intl.formatMessage({
                                                    id: "txtWartoscWarunku",
                                                    defaultMessage: "Condition value",
                                                })}
                                            </span>
                                            <Input
                                                value={rule.compareValue}
                                                onChange={(event) => updateRule(rule.id, currentRule => ({
                                                    ...currentRule,
                                                    compareValue: event.target.value,
                                                }))}
                                            />
                                        </label>
                                    )}
                                </div>

                                {rule.kind === PRESENTATION_RULE_KIND_TEMPLATE && (
                                    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
                                        <label className="flex flex-col gap-1 text-sm">
                                            <span className="font-medium">
                                                {intl.formatMessage({
                                                    id: "txtSzablon",
                                                    defaultMessage: "Template",
                                                })}
                                            </span>
                                            <Select
                                                value={rule.templateType}
                                                options={PRESENTATION_TEMPLATE_DEFINITIONS}
                                                onChange={(nextTemplateType) => updateRule(rule.id, currentRule => ({
                                                    ...currentRule,
                                                    templateType: nextTemplateType,
                                                }))}
                                            />
                                        </label>

                                        {rule.templateType === "badge" && (
                                            <>
                                                <label className="flex flex-col gap-1 text-sm">
                                                    <span className="font-medium">
                                                        {intl.formatMessage({
                                                            id: "txtKolorTla",
                                                            defaultMessage: "Background color",
                                                        })}
                                                    </span>
                                                    <ColorInput
                                                        value={rule.templateOptions?.backgroundColor}
                                                        onChange={(nextColor) => updateRule(rule.id, currentRule => ({
                                                            ...currentRule,
                                                            templateOptions: {
                                                                ...currentRule.templateOptions,
                                                                backgroundColor: nextColor,
                                                            },
                                                        }))}
                                                    />
                                                </label>
                                                <label className="flex flex-col gap-1 text-sm">
                                                    <span className="font-medium">
                                                        {intl.formatMessage({
                                                            id: "txtKolorTekstu",
                                                            defaultMessage: "Text color",
                                                        })}
                                                    </span>
                                                    <ColorInput
                                                        value={rule.templateOptions?.textColor}
                                                        onChange={(nextColor) => updateRule(rule.id, currentRule => ({
                                                            ...currentRule,
                                                            templateOptions: {
                                                                ...currentRule.templateOptions,
                                                                textColor: nextColor,
                                                            },
                                                        }))}
                                                    />
                                                </label>
                                            </>
                                        )}
                                    </div>
                                )}

                                {rule.kind === PRESENTATION_RULE_KIND_DECORATION && (
                                    <div className="mt-4">
                                        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                                            <LuPaintbrush className="text-skin-base"/>
                                            {intl.formatMessage({
                                                id: "txtDekoracja",
                                                defaultMessage: "Decoration",
                                            })}
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                                            <label className="flex flex-col gap-1 text-sm">
                                                <span className="font-medium">
                                                    {intl.formatMessage({
                                                        id: "txtKlasaCss",
                                                        defaultMessage: "CSS class",
                                                    })}
                                                </span>
                                                <Input
                                                    value={rule.decoration?.className}
                                                    onChange={(event) => updateRule(rule.id, currentRule => ({
                                                        ...currentRule,
                                                        decoration: {
                                                            ...currentRule.decoration,
                                                            className: event.target.value,
                                                        },
                                                    }))}
                                                />
                                            </label>

                                            <label className="flex flex-col gap-1 text-sm">
                                                <span className="font-medium">
                                                    {intl.formatMessage({
                                                        id: "txtKolorTekstu",
                                                        defaultMessage: "Text color",
                                                    })}
                                                </span>
                                                <ColorInput
                                                    value={rule.decoration?.textColor}
                                                    onChange={(nextColor) => updateRule(rule.id, currentRule => ({
                                                        ...currentRule,
                                                        decoration: {
                                                            ...currentRule.decoration,
                                                            textColor: nextColor,
                                                        },
                                                    }))}
                                                />
                                            </label>

                                            <label className="flex flex-col gap-1 text-sm">
                                                <span className="font-medium">
                                                    {intl.formatMessage({
                                                        id: "txtKolorTla",
                                                        defaultMessage: "Background color",
                                                    })}
                                                </span>
                                                <ColorInput
                                                    value={rule.decoration?.backgroundColor}
                                                    onChange={(nextColor) => updateRule(rule.id, currentRule => ({
                                                        ...currentRule,
                                                        decoration: {
                                                            ...currentRule.decoration,
                                                            backgroundColor: nextColor,
                                                        },
                                                    }))}
                                                />
                                            </label>

                                            <label className="flex flex-col gap-1 text-sm">
                                                <span className="font-medium">
                                                    {intl.formatMessage({
                                                        id: "txtGruboscTekstu",
                                                        defaultMessage: "Font weight",
                                                    })}
                                                </span>
                                                <Select
                                                    value={rule.decoration?.fontWeight || "normal"}
                                                    options={PRESENTATION_FONT_WEIGHT_OPTIONS}
                                                    onChange={(nextFontWeight) => updateRule(rule.id, currentRule => ({
                                                        ...currentRule,
                                                        decoration: {
                                                            ...currentRule.decoration,
                                                            fontWeight: nextFontWeight,
                                                        },
                                                    }))}
                                                />
                                            </label>

                                            <label className="flex flex-col gap-1 text-sm">
                                                <span className="font-medium">
                                                    {intl.formatMessage({
                                                        id: "txtWyrownanie",
                                                        defaultMessage: "Alignment",
                                                    })}
                                                </span>
                                                <Select
                                                    value={rule.decoration?.textAlign || ""}
                                                    options={PRESENTATION_TEXT_ALIGN_OPTIONS}
                                                    onChange={(nextTextAlign) => updateRule(rule.id, currentRule => ({
                                                        ...currentRule,
                                                        decoration: {
                                                            ...currentRule.decoration,
                                                            textAlign: nextTextAlign,
                                                        },
                                                    }))}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                            </SortableRuleCard>
                        );
                    })}
                </div>
                </SortableContext>
                </DndContext>
            </div>
        </BaseModal>
    );
}
