import React, { useState, useEffect } from "react";
import styles from "../../styles/search/search.module.scss";
import { setPage, setSearchText } from "../../store/gameSlice";
import { AppDispatch } from "../../store/index";
import { useDispatch } from "react-redux";

const MIN_SEARCH_LENGTH = 2;

const SearchBox: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [text, setText] = useState<string>("");
  const [debounceText, setDebounceText] = useState<string>("");

  useEffect(() => {
    const handler = setTimeout(() => {
      const normalizedText = debounceText.trim();

      // Input boşsa tüm listeye dön.
      if (normalizedText.length === 0) {
        dispatch(setSearchText(""));
        dispatch(setPage(1));
        return;
      }

      // 1 karakterse API isteği atma, listeyi olduğu gibi bırak.
      if (normalizedText.length < MIN_SEARCH_LENGTH) {
        return;
      }

      // 2+ karakterse search yap.
      dispatch(setSearchText(normalizedText));
      dispatch(setPage(1));
    }, 350);

    return () => clearTimeout(handler);
  }, [debounceText, dispatch]);

  const search = (value: string) => {
    setText(value);
    setDebounceText(value);
  };

  return (
    <div>
      <div className={styles.inputSection}>
        <input
          value={text}
          className={styles.searchInput}
          placeholder="Search Game"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            search(e.target.value)
          }
        />
      </div>
    </div>
  );
};

export default SearchBox;