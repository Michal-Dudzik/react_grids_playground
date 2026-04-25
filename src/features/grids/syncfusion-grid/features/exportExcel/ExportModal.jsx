import {memo} from "react";
import {Modal} from "antd";
import CustomSpinner from "../../../custom-spinner/CustomSpinner.jsx";

const ExportModalComponent = ({visible, intl}) => (
    <Modal
        open={visible}
        footer={null}
        closable={false}
        centered
        width={400}
        maskClosable={false}
    >
        <div className="py-8 flex flex-col items-center gap-4">
            <CustomSpinner/>
            <div className="text-center">
                <h3 className="text-lg font-medium mb-2">
                    {intl.formatMessage({id: "txtEksportowanieDoExcel"})}
                </h3>
                <p className="text-gray-500">
                    {intl.formatMessage({id: "txtProszeCzekac"})}
                </p>
            </div>
        </div>
    </Modal>
);

ExportModalComponent.displayName = 'ExportModal';

export const ExportModal = memo(ExportModalComponent);
