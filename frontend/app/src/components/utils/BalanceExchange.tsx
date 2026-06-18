import React, {useEffect, useState} from 'react';
import { Modal } from 'antd';
import { getExchange } from '../../api/apiCalls';
import Loading from './Loading';

interface BalanceExchangeProps {
    isOpen: boolean;
    balance: number;
    setModalOpen: Function
}

const BalanceExchange: React.FC<BalanceExchangeProps> = ({ isOpen, balance, setModalOpen }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [exChangeData, setExchangeData] = useState<any>({});
    //we are using exchange rate api to show the exchange of the coins. the component appears as a modal to the user
    useEffect(() => {
        const getCurrentExchange = async () => {
            const response = await getExchange();
            setExchangeData(response.data);
            console.log(response.data)
        }
        getCurrentExchange();
        setIsModalOpen(isOpen);
    }, [isOpen]);

    const handleOk = () => {
        setModalOpen(false);
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setModalOpen(false);
        setIsModalOpen(false);
    };

    return (
        <>
            <Modal title="Balance Exchange" open={isModalOpen} onOk={handleOk} onCancel={handleCancel} footer={null}>
                {exChangeData ?             
                <div>
                    <p>Current Balance: {balance}</p>
                    <p>EUR: {(exChangeData?.conversion_rates?.EUR * balance).toFixed(2)}</p>
                    <p>USD: {(exChangeData?.conversion_rates?.USD * balance).toFixed(2)}</p>
                    <p>GBP: {(exChangeData?.conversion_rates?.GBP * balance).toFixed(2)}</p>
                    <p>TRY: {(exChangeData?.conversion_rates?.TRY * balance).toFixed(2)}</p>
                </div> : <Loading />}
            </Modal>
        </>
    );
};

export default BalanceExchange;