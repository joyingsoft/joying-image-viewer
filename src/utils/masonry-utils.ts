import React from 'react';
import { AppLoadedImgProps } from '../types/app-loaded-img-props';

export const DEFAULT_COLUMNS = 1;

/**
 * Simply divide children to number of given columns.
 * @param columns number of columns to divide children.
 * @param children will paser this React.Children to array.
 */
export const getChildrenInColumns = (
  columns: number,
  children: React.ReactNode,
) => {
  const columnsChildren = new Array<
    (React.ReactChild | React.ReactFragment | React.ReactPortal)[]
  >(columns);

  const childrenArray = React.Children.toArray(children);

  for (let i = 0; i < childrenArray.length; i++) {
    const colIndex = i % columns;

    if (!columnsChildren[colIndex]) {
      columnsChildren[colIndex] = [];
    }

    columnsChildren[colIndex].push(childrenArray[i]);
  }

  return columnsChildren;
};

const getKeyValue = (key: string | number) => {
  return key.toString().replace('.$', '');
};

const HEIGHT_BASE_VALUE = 100;

const getEstimatedHeight = (
  loadedImgs: Map<string, AppLoadedImgProps>,
  key: string | number,
  width = HEIGHT_BASE_VALUE,
) => {
  const ratio = loadedImgs.get(getKeyValue(key))?.aspectRatio;
  return ratio ? width / ratio : 0;
};

const getColumnChildrenHeight = (
  loadedImgs: Map<string, AppLoadedImgProps>,
  col: (React.ReactChild | React.ReactFragment | React.ReactPortal)[],
) =>
  col
    .map((v) =>
      React.isValidElement(v) && v.key
        ? getEstimatedHeight(loadedImgs, v.key)
        : 0,
    )
    .reduce((p, c) => p + c, 0);

const getLastImgHeight = (
  loadedImgs: Map<string, AppLoadedImgProps>,
  col: (React.ReactChild | React.ReactFragment | React.ReactPortal)[],
) => {
  const lastImg = col[col.length - 1];
  return React.isValidElement(lastImg) && lastImg.key
    ? getEstimatedHeight(loadedImgs, lastImg.key)
    : 0;
};

/**
 * Equalize already divided children in columns.
 * - recusivly move last element in a heighest column
 * - to a shortest height column.
 *
 * @param loadedImgs: Map<key:string, AppLoadedImgProps>
 * @param columnsChildren existed columnsChildren
 */
const equalizeChildrenInColumns = (
  loadedImgs: Map<string, AppLoadedImgProps>,
  columnsChildren: (
    | React.ReactChild
    | React.ReactFragment
    | React.ReactPortal
  )[][],
) => {
  const colHeights = [];
  for (let i = 0; i < columnsChildren.length; i++) {
    colHeights[i] = getColumnChildrenHeight(loadedImgs, columnsChildren[i]);
  }

  const minColH = Math.min(...colHeights);
  const minColHIndex = colHeights.indexOf(minColH);
  const maxColH = Math.max(...colHeights);
  const maxColHIndex = colHeights.indexOf(maxColH);

  const maxLastElH = getLastImgHeight(
    loadedImgs,
    columnsChildren[maxColHIndex],
  );

  if (maxColH - maxLastElH > minColH) {
    // move last el from max col to min col
    const lastEl = columnsChildren[maxColHIndex].pop();
    if (lastEl) {
      columnsChildren[minColHIndex].push(lastEl);
      columnsChildren = equalizeChildrenInColumns(loadedImgs, columnsChildren);
    }
  }

  return columnsChildren;
};

export const getEqualizedChildrenInColumns = (
  columns: number,
  hasAllRatios: boolean,
  loadedImgs: Map<string, AppLoadedImgProps>,
  children: React.ReactNode,
) =>
  hasAllRatios
    ? equalizeChildrenInColumns(
        loadedImgs,
        getChildrenInColumns(columns, children),
      )
    : getChildrenInColumns(columns, children);
