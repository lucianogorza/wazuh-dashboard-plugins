import React, { useEffect, useState } from 'react';
import {
  EuiButtonEmpty,
  EuiLink,
  EuiPopover,
  EuiSpacer,
  EuiSelect,
  EuiText,
} from '@elastic/eui';
import { EuiSuggest } from '../eui-suggest';
import { searchBarQueryLanguages } from './query-language';

type Props = {
  defaultMode?: string;
  modes: { id: string; [key: string]: any }[];
  onChange?: (params: any) => void;
  onSearch: (params: any) => void;
  input?: string;
};

export const SearchBar = ({
  defaultMode,
  modes,
  onChange,
  onSearch,
  ...rest
}: Props) => {
  // Query language ID and configuration
  const [queryLanguage, setQueryLanguage] = useState<{
    id: string;
    configuration: any;
  }>({
    id: defaultMode || modes[0].id,
    configuration:
      searchBarQueryLanguages[
        defaultMode || modes[0].id
      ]?.getConfiguration?.() || {},
  });
  // Popover query language is open
  const [isOpenPopoverQueryLanguage, setIsOpenPopoverQueryLanguage] =
    useState<boolean>(false);
  // Input field
  const [input, setInput] = useState<string | undefined>('');
  // Query language output of run method
  const [queryLanguageOutputRun, setQueryLanguageOutputRun] = useState<any>({
    searchBarProps: { suggestions: [] },
    output: undefined,
  });
  // Controls when the suggestion popover is open/close
  const [isOpenSuggestionPopover, setIsOpenSuggestionPopover] =
    useState<boolean>(false);
  // Reference to the input
  const [inputRef, setInputRef] = useState();

  // Handler when searching
  const _onSearch = (output: any) => {
    // TODO: fix when searching
    inputRef && inputRef.blur();
    setIsOpenSuggestionPopover(false);
    onSearch(output);
  };

  // Handler on change the input field text
  const onChangeInput = (event: React.ChangeEvent<HTMLInputElement>) =>
    setInput(event.target.value);

  // Handler when pressing a key
  const onKeyPressHandler = event => {
    if (event.key === 'Enter') {
      _onSearch(queryLanguageOutputRun.output);
    }
  };

  useEffect(() => {
    // React to external changes and set the internal input text. Use the `transformUnifiedQuery` of
    // the query language in use
    setInput(
      searchBarQueryLanguages[queryLanguage.id]?.transformUnifiedQuery?.(
        rest.input,
      ),
    );
  }, [rest.input]);

  useEffect(() => {
    (async () => {
      // Set the query language output
      setQueryLanguageOutputRun(
        await searchBarQueryLanguages[queryLanguage.id].run(input, {
          onSearch: _onSearch,
          setInput,
          closeSuggestionPopover: () => setIsOpenSuggestionPopover(false),
          openSuggestionPopover: () => setIsOpenSuggestionPopover(true),
          queryLanguage: {
            configuration: queryLanguage.configuration,
            parameters: modes.find(({ id }) => id === queryLanguage.id),
          },
          setQueryLanguageConfiguration: (configuration: any) =>
            setQueryLanguage(state => ({
              ...state,
              configuration:
                configuration?.(state.configuration) || configuration,
            })),
        }),
      );
    })();
  }, [input, queryLanguage]);

  useEffect(() => {
    onChange && onChange(queryLanguageOutputRun.output);
  }, [queryLanguageOutputRun.output]);

  const onQueryLanguagePopoverSwitch = () =>
    setIsOpenPopoverQueryLanguage(state => !state);

  return (
    <EuiSuggest
      inputRef={setInputRef}
      value={input}
      onChange={onChangeInput}
      onKeyPress={onKeyPressHandler}
      onInputChange={() => {}}
      isPopoverOpen={
        queryLanguageOutputRun.searchBarProps.suggestions.length > 0 &&
        isOpenSuggestionPopover
      }
      onClosePopover={() => setIsOpenSuggestionPopover(false)}
      onPopoverFocus={() => setIsOpenSuggestionPopover(true)}
      placeholder={'Search'}
      append={
        <EuiPopover
          button={
            <EuiButtonEmpty onClick={onQueryLanguagePopoverSwitch}>
              {searchBarQueryLanguages[queryLanguage.id].label}
            </EuiButtonEmpty>
          }
          isOpen={isOpenPopoverQueryLanguage}
          closePopover={onQueryLanguagePopoverSwitch}
        >
          <EuiText>
            {searchBarQueryLanguages[queryLanguage.id].description}
          </EuiText>
          {searchBarQueryLanguages[queryLanguage.id].documentationLink && (
            <>
              <EuiSpacer />
              <div>
                <EuiLink
                  href={
                    searchBarQueryLanguages[queryLanguage.id].documentationLink
                  }
                >
                  Documentation
                </EuiLink>
              </div>
            </>
          )}
          {modes?.length && modes.length > 1 && (
            <>
              <EuiSpacer />
              <EuiSelect
                id='query-language-selector'
                options={modes.map(({ id }) => ({
                  value: id,
                  text: searchBarQueryLanguages[id].label,
                }))}
                value={queryLanguage.id}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  const queryLanguageID: string = event.target.value;
                  setQueryLanguage({
                    id: queryLanguageID,
                    configuration:
                      searchBarQueryLanguages[
                        queryLanguageID
                      ]?.getConfiguration?.() || {},
                  });
                  setInput('');
                }}
                aria-label='query-language-selector'
              />
            </>
          )}
        </EuiPopover>
      }
      {...queryLanguageOutputRun.searchBarProps}
    />
  );
};