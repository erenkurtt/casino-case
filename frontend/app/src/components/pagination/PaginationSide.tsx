"use client";

import React, { useEffect } from "react";
import { Pagination } from "antd";
import { usePathname, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import styles from "../../styles/pagination/pagination.module.scss";
import { RootState, AppDispatch } from "../../store/index";
import { setLimit, setPage } from "../../store/gameSlice";

const ALLOWED_PAGE_SIZES = [10, 20, 50];

const PaginationSide: React.FC = () => {
  const urlParams = useSearchParams();
  const pathname = usePathname();

  const dispatch = useDispatch<AppDispatch>();

  const pageNumb = useSelector((state: RootState) => state.game.page);
  const limit = useSelector((state: RootState) => state.game.limit);
  const totalPage = useSelector((state: RootState) => state.game.totalPage);
  const totalItems = useSelector((state: RootState) => state.game.totalItems);

  useEffect(() => {
    const pageFromUrl = urlParams?.get("page");
    const limitFromUrl = urlParams?.get("limit");

    const parsedPage = pageFromUrl ? Number(pageFromUrl) : 1;
    const parsedLimit = limitFromUrl ? Number(limitFromUrl) : 20;

    dispatch(setPage(parsedPage > 0 ? parsedPage : 1));

    if (ALLOWED_PAGE_SIZES.includes(parsedLimit)) {
      dispatch(setLimit(parsedLimit));
    }
  }, [urlParams, dispatch]);

  useEffect(() => {
    if (totalPage > 0 && pageNumb > totalPage) {
      updatePagination(totalPage, limit);
    }
  }, [totalPage, pageNumb, limit]);

  const updatePagination = (page: number, pageSize: number) => {
    dispatch(setPage(page));
    dispatch(setLimit(pageSize));

    const newSearchParams = new URLSearchParams(urlParams?.toString());

    newSearchParams.set("page", page.toString());
    newSearchParams.set("limit", pageSize.toString());

    window.history.pushState(null, "", `${pathname}?${newSearchParams.toString()}`);
  };

  const onChangePage = (page: number, pageSize: number) => {
    const pageSizeChanged = pageSize !== limit;
    const nextPage = pageSizeChanged ? 1 : page;

    updatePagination(nextPage, pageSize);
  };

  return (
    <div className={styles.paginationSide}>
      <Pagination
        current={pageNumb}
        total={totalItems}
        pageSize={limit}
        pageSizeOptions={["10", "20", "50"]}
        showSizeChanger
        onChange={onChangePage}
        className={styles.pagination}
      />
    </div>
  );
};

export default PaginationSide;