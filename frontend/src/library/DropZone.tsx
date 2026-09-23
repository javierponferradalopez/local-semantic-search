import {type ChangeEvent, type DragEvent, type JSX, useState} from 'react';

type Props = {onFile: (file: File) => void};

export const DropZone = ({onFile}: Props): JSX.Element => {
  const [isUnderADrag, setIsUnderADrag] = useState(false);

  const takeTheFirstOf = (files: FileList | null): void => {
    const file = files?.[0];

    if (file !== undefined) {
      onFile(file);
    }
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>): void => {
    event.preventDefault();
    setIsUnderADrag(false);
    takeTheFirstOf(event.dataTransfer.files);
  };

  const onDragOver = (event: DragEvent<HTMLLabelElement>): void => {
    event.preventDefault();
    setIsUnderADrag(true);
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>): void => {
    takeTheFirstOf(event.target.files);
    event.target.value = '';
  };

  return (
    <label
      className={isUnderADrag ? 'drop-zone drop-zone--under-a-drag' : 'drop-zone'}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={() => setIsUnderADrag(false)}
    >
      Drop a file here, or pick one.
      <input type="file" onChange={onChange} />
    </label>
  );
};
