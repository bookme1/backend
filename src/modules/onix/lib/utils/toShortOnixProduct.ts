import {
  OnixContributorRole,
  OnixResourceContentType,
  OnixTitleType,
} from '@onix/types/enums';
import { OnixProductFull, ShortOnixProduct } from '@onix/types/interfaces';

/**
 * A utility function that extracts minimal "short" data
 * from an OnixProductFull object.
 */
export function toShortOnixProduct(full: OnixProductFull): ShortOnixProduct {
  // 1) ID: prefer ISBN (if found), else recordReference
  let id = full.recordReference;
  if (full.productIdentifiers) {
    const isbnPid = full.productIdentifiers.find(
      (pid) => pid.productIDType === 15,
    );
    if (isbnPid?.idValue) {
      id = isbnPid.idValue;
    }
  }

  // 2) Title: look for "titleType=1" or just take first
  let title = 'No title';
  const dd = full.descriptiveDetail;
  if (dd?.titles && dd.titles.length > 0) {
    // find DistinctiveTitle
    const mainTitle =
      dd.titles.find((t) => t.titleType === OnixTitleType.DistinctiveTitle) ||
      dd.titles[0];
    if (mainTitle?.titleText) {
      title = mainTitle.titleText;
    }
  }

  // 3) Contributors: gather all with role=Author (A01)
  const contributorsArr: string[] = [];
  if (dd?.contributors && dd.contributors.length > 0) {
    // we collect all that have contributorRole includes "A01"
    dd.contributors.forEach((c) => {
      if (c.contributorRole?.includes(OnixContributorRole.Author)) {
        if (c.personName) contributorsArr.push(c.personName);
      }
    });
  }
  const contributors = contributorsArr.join(', ');

  // 4) coverUrl => find "resourceContentType=1" (front cover)
  let coverUrl = '';
  const cd = full.collateralDetail;
  if (cd?.supportingResources) {
    const coverRes = cd.supportingResources.find(
      (sr) => sr.resourceContentType === OnixResourceContentType.FrontCover,
    );
    if (coverRes?.resourceVersions && coverRes.resourceVersions.length > 0) {
      coverUrl = coverRes.resourceVersions[0].resourceLink || '';
    }
  }

  // 5) description => look for textContent with textType=3
  let description = '';
  if (cd?.textContents) {
    const descText = cd.textContents.find((tc) => tc.textType === 3); // main description
    if (descText?.text) {
      description = descText.text;
    }
  }

  // 6) price => from productSupply
  let price = 0;
  let currency = 'UAH'; // default?
  let availability = false;
  const ps = full.productSupply;
  if (ps?.supplyDetail?.price?.priceAmount) {
    price = ps.supplyDetail.price.priceAmount;
    if (ps.supplyDetail.price.currencyCode) {
      currency = ps.supplyDetail.price.currencyCode;
    }
  }

  // Check availability
  // e.g. if productAvailability=40 => true
  if (ps?.supplyDetail?.productAvailability === 40) {
    availability = true;
  }

  return {
    id,
    title,
    contributors,
    coverUrl,
    description,
    price,
    currency,
    availability,
  };
}
