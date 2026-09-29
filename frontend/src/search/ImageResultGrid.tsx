import type {ImageResult} from 'contract/ImageResult';
import type {JSX} from 'react';

type Props = {results: ImageResult[]};

// A Picture is its whole Resource, so it has no place to cite.
export const ImageResultGrid = ({results}: Props): JSX.Element => {
  if (results.length === 0) {
    return <p>No image was found.</p>;
  }

  return (
    <ul className="image-results">
      {results.map(result => (
        <li key={result.resourceId} className="image-result">
          <a href={result.fileUrl} target="_blank" rel="noopener noreferrer">
            {/* Inside an <img>, an SVG runs no script (ADR-0004). */}
            <img className="image-result__thumbnail" src={result.thumbnailUrl} alt="" />
            <span className="image-result__name">{result.name}</span>
          </a>
        </li>
      ))}
    </ul>
  );
};
