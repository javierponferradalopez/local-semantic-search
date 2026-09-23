import {CONTENT_TYPE_BY_EXTENSION} from 'contract/ContentTypeByExtension';
import type {ErrorItem} from 'contract/ErrorItem';
import {MAXIMUM_FILE_SIZE_IN_BYTES} from 'contract/MaximumFileSizeInBytes';
import {type ChangeEvent, type DragEvent, type JSX, useId, useState} from 'react';
import {refusalOfFiles} from '@/library/refusalOfFiles';
import {textOfSize} from '@/library/textOfSize';

type Props = {onFile: (file: File) => void; onRefusal: (item: ErrorItem) => void};

const EXTENSIONS: string[] = [...CONTENT_TYPE_BY_EXTENSION.keys()];

const ACCEPT = EXTENSIONS.join(',');

const WHAT_IT_TAKES = `It takes ${new Intl.ListFormat('en-GB', {type: 'disjunction'}).format(EXTENSIONS)}, up to ${textOfSize(MAXIMUM_FILE_SIZE_IN_BYTES)}.`;

export const DropZone = ({onFile, onRefusal}: Props): JSX.Element => {
  const [isUnderADrag, setIsUnderADrag] = useState(false);
  const whatItTakesId = useId();

  const judge = (fileList: FileList | null): void => {
    const files = [...(fileList ?? [])];

    if (files.length === 0) {
      return;
    }

    const refusal = refusalOfFiles(files);

    if (refusal === undefined) {
      onFile(files[0]);
    } else {
      onRefusal(refusal);
    }
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>): void => {
    event.preventDefault();
    setIsUnderADrag(false);
    judge(event.dataTransfer.files);
  };

  const onDragOver = (event: DragEvent<HTMLLabelElement>): void => {
    event.preventDefault();
    setIsUnderADrag(true);
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>): void => {
    judge(event.target.files);
    event.target.value = '';
  };

  return (
    <>
      <label
        className={isUnderADrag ? 'drop-zone drop-zone--under-a-drag' : 'drop-zone'}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={() => setIsUnderADrag(false)}
      >
        Drop a file here, or pick one.
        <input
          type="file"
          accept={ACCEPT}
          aria-describedby={whatItTakesId}
          onChange={onChange}
        />
      </label>
      <p id={whatItTakesId}>{WHAT_IT_TAKES}</p>
    </>
  );
};
