import {describe, expect, it, vi} from "vitest";
import {
    getContextMenuItems,
    useFeatureContextMenu,
} from "../features/contextMenu/useContextMenu.js";
import {renderHookWithProviders} from "../../../../test/renderWithProviders.jsx";

describe("getContextMenuItems", () => {
    it("keeps defaults unless a custom item overrides the same id", () => {
        const merged = getContextMenuItems(
            ["AutoFit", {id: "edit", text: "Edit"}],
            [{id: "edit", text: "Custom Edit"}]
        );

        expect(merged).toEqual(["AutoFit", {id: "edit", text: "Custom Edit"}]);
    });
});

describe("useFeatureContextMenu", () => {
    it("removes hidden items and marks disabled items in the generated menu", () => {
        const onEdit = vi.fn();
        const onDelete = vi.fn();

        const {result} = renderHookWithProviders(() => useFeatureContextMenu({
            items: [
                {
                    id: "edit",
                    text: "Edit",
                    action: onEdit,
                    disabled: (context) => context.readOnly,
                },
                {
                    id: "delete",
                    text: "Delete",
                    action: onDelete,
                    hidden: (context) => context.hideDelete,
                },
            ],
            intl: {
                formatMessage: ({id, defaultMessage}) => defaultMessage || id,
            },
            context: {
                readOnly: true,
                hideDelete: true,
            },
        }));

        expect(result.current.contextMenuItems).toHaveLength(1);
        expect(result.current.contextMenuItems[0].id).toBe("edit");
        expect(result.current.contextMenuItems[0].cssClass).toContain("e-disabled");
        expect(result.current.disabledMap.edit).toBe(true);
        expect(result.current.disabledMap.delete).toBe(false);

        result.current.onContextMenuClick({item: {id: "edit"}});

        expect(onEdit).not.toHaveBeenCalled();
    });

    it("calls the mapped action for enabled items", () => {
        const onEdit = vi.fn();

        const {result} = renderHookWithProviders(() => useFeatureContextMenu({
            items: [
                {
                    id: "edit",
                    text: "Edit",
                    action: onEdit,
                },
            ],
            intl: {
                formatMessage: ({id, defaultMessage}) => defaultMessage || id,
            },
        }));

        const args = {item: {id: "edit"}};
        result.current.onContextMenuClick(args);

        expect(onEdit).toHaveBeenCalledWith(args, undefined);
    });
});
