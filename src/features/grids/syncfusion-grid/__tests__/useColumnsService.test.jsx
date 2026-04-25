import {act, render, waitFor} from "@testing-library/react";
import {describe, expect, it, vi, beforeEach} from "vitest";
import {renderHookWithProviders} from "../../../../test/renderWithProviders.jsx";
import {IntlProvider} from "react-intl";
import {useEffect} from "react";

const {
    apiClientMock,
    showErrorToastMock,
} = vi.hoisted(() => ({
    apiClientMock: {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        clearCache: vi.fn(),
    },
    showErrorToastMock: vi.fn(),
}));

vi.mock("../../../../api/apiClient.js", () => ({
    default: apiClientMock,
}));

vi.mock("../../error-toast/showErrorToast.jsx", () => ({
    showErrorToast: showErrorToastMock,
}));

const {useColumnsService} = await import("../features/columns/useColumnsService.js");

const intlMessages = {
    txtBladLadowaniaKolumn: "Error loading columns",
};

function createDeferred() {
    let resolve;
    let reject;

    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return {promise, resolve, reject};
}

describe("useColumnsService", () => {
    beforeEach(() => {
        apiClientMock.get.mockReset();
        apiClientMock.put.mockReset();
        apiClientMock.delete.mockReset();
        apiClientMock.clearCache.mockReset();
        showErrorToastMock.mockReset();
    });

    it("autoloads columns and stores the successful response", async () => {
        const apiColumns = [{alias: "amount"}];
        apiClientMock.get.mockResolvedValue(apiColumns);

        const {result} = renderHookWithProviders(() => useColumnsService({
            appId: 10,
            gridId: 20,
            defaultColumns: [{field: "fallback"}],
        }), {withRouter: false, messages: intlMessages});

        await waitFor(() => {
            expect(result.current.columns).toEqual(apiColumns);
        });

        expect(apiClientMock.get).toHaveBeenCalledWith(
            "/api/SysUserInfo/gridColumnsByUser?appId=10&gridId=20&languageCode=en-US",
            expect.objectContaining({
                cache: true,
                retries: 2,
            })
        );
        expect(result.current.loaded).toBe(true);
    });

    it("deduplicates concurrent fetches for the same grid request", async () => {
        const deferred = createDeferred();
        apiClientMock.get.mockReturnValue(deferred.promise);

        const {result} = renderHookWithProviders(() => useColumnsService({
            appId: 10,
            gridId: 20,
            autoLoad: false,
            defaultColumns: [],
        }), {withRouter: false, messages: intlMessages});

        let promiseA;
        let promiseB;

        await act(async () => {
            promiseA = result.current.fetchColumns();
            promiseB = result.current.fetchColumns();
        });

        expect(apiClientMock.get).toHaveBeenCalledTimes(1);

        deferred.resolve([{alias: "code"}]);

        let resolved;
        await act(async () => {
            resolved = await Promise.all([promiseA, promiseB]);
        });

        expect(resolved).toEqual([[{alias: "code"}], [{alias: "code"}]]);
        expect(result.current.columns).toEqual([{alias: "code"}]);
    });

    it("falls back to default columns and shows an error toast on fetch failure", async () => {
        const error = new Error("Request failed");
        apiClientMock.get.mockRejectedValue(error);

        const defaultColumns = [{field: "fallback"}];

        const {result} = renderHookWithProviders(() => useColumnsService({
            appId: 10,
            gridId: 20,
            defaultColumns,
        }), {withRouter: false, messages: intlMessages});

        await waitFor(() => {
            expect(showErrorToastMock).toHaveBeenCalled();
        });

        expect(result.current.columns).toEqual(defaultColumns);
        expect(showErrorToastMock).toHaveBeenCalledWith(expect.objectContaining({
            title: "Error loading columns",
            error,
            location: "useColumnsService: fetchColumns",
        }));
        expect(result.current.loaded).toBe(true);
    });

    it("updates and deletes columns while clearing the matching cache key", async () => {
        apiClientMock.put.mockResolvedValue({success: true});
        apiClientMock.delete.mockResolvedValue({success: true});

        const {result} = renderHookWithProviders(() => useColumnsService({
            appId: 10,
            gridId: 20,
            autoLoad: false,
            defaultColumns: [],
        }), {withRouter: false, messages: intlMessages});

        await act(async () => {
            await result.current.updateColumns([{alias: "amount"}]);
        });

        await act(async () => {
            await result.current.deleteColumns();
        });

        expect(apiClientMock.put).toHaveBeenCalledWith(
            "/api/SysUserInfo/gridColumnsByUser?appId=10&gridId=20",
            [{alias: "amount"}],
            expect.objectContaining({timeout: 15000})
        );
        expect(apiClientMock.delete).toHaveBeenCalledWith(
            "/api/SysUserInfo/gridColumnsByUser?appId=10&gridId=20",
            expect.objectContaining({timeout: 10000})
        );
        expect(apiClientMock.clearCache).toHaveBeenCalledWith("gridColumnsByUser?appId=10&gridId=20");
    });

    it("refetches columns when the locale changes for the same grid", async () => {
        apiClientMock.get
            .mockResolvedValueOnce([{alias: "amount"}])
            .mockResolvedValueOnce([{alias: "kwota"}]);

        const observed = {current: null};

        const HookProbe = () => {
            const hookState = useColumnsService({
                appId: 10,
                gridId: 20,
                defaultColumns: [{field: "fallback"}],
            });

            useEffect(() => {
                observed.current = hookState;
            }, [hookState]);

            return null;
        };

        const locale = "en-US";

        const {rerender} = render(
            <IntlProvider locale={locale} messages={intlMessages}>
                <HookProbe/>
            </IntlProvider>
        );

        await waitFor(() => {
            expect(observed.current.columns).toEqual([{alias: "amount"}]);
        });

        rerender(
            <IntlProvider locale="pl-PL" messages={intlMessages}>
                <HookProbe/>
            </IntlProvider>
        );

        await waitFor(() => {
            expect(observed.current.columns).toEqual([{alias: "kwota"}]);
        });

        expect(apiClientMock.get).toHaveBeenNthCalledWith(
            1,
            "/api/SysUserInfo/gridColumnsByUser?appId=10&gridId=20&languageCode=en-US",
            expect.any(Object)
        );
        expect(apiClientMock.get).toHaveBeenNthCalledWith(
            2,
            "/api/SysUserInfo/gridColumnsByUser?appId=10&gridId=20&languageCode=pl-PL",
            expect.any(Object)
        );
    });
});
