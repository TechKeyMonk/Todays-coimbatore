'use client';

import React from 'react';
import AudioReader from './AudioReader';

export interface AiReaderProps {
  textToRead?: string;
  title?: string;
  author?: string;
  lang?: string;
  compact?: boolean;
}

export const AiReader: React.FC<AiReaderProps> = (props) => {
  return <AudioReader textToRead={props.textToRead || ''} {...props} />;
};

export default AiReader;
