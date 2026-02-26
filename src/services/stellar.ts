import { basename } from 'node:path';
import type { ImageMetadata } from 'astro';
import type { Sign } from '@/shared/types/Sign';
import { SignGroup } from '@/shared/types/SignGroup';

const Locators = import.meta.glob('@/assets/*.loc', {
  query: '?raw',
  import: 'default',
});

export const ImageAssets: { [i: string]: ImageMetadata } = import.meta.glob(
  '@/assets/*.{png,jpg}',
  {
    eager: true,
    import: 'default',
  },
);

export const getLocatorGroup = ({ src, name }: Record<string, string>) => {
  if (ImageAssets[src].format === 'png') {
    if (/black$/i.test(name)) {
      return SignGroup.OverlayDark;
    } else {
      return SignGroup.OverlayLight;
    }
  } else if (/^black\s{1}\S*$/i.test(name)) {
    return SignGroup.BlackStartCpFinish;
  } else if (/^white\s{1}\S*$/i.test(name)) {
    return SignGroup.WhiteStartCpFinish;
  }

  const colorMatch = /(white|green|blue|red|black)$/i.exec(name);
  if (colorMatch) {
    return SignGroup[colorMatch[1] as keyof typeof SignGroup];
  }

  return SignGroup.Default;
};

export const isOverlaySignGroup = (group: SignGroup) => {
  return [SignGroup.OverlayLight, SignGroup.OverlayDark].includes(group);
};

const backgroundAssets = Object.entries(ImageAssets);
export const backgroundSigns: { [key in SignGroup]?: ImageMetadata } = {
  [SignGroup.OverlayLight]: backgroundAssets.find(
    ([name]) => 'black.jpg' === basename(name),
  )?.[1],
  [SignGroup.OverlayDark]: backgroundAssets.find(
    ([name]) => 'white.jpg' === basename(name),
  )?.[1],
};

export async function getSigns(): Promise<Sign[]> {
  const signsList: Sign[] = [];
  for (const locator in Locators) {
    await Locators[locator]().then((locfile) => {
      const loc = locfile as Sign['loc'];

      const name = basename(locator.slice(0, -8))
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const src = locator.slice(0, -4);

      const group = getLocatorGroup({ src, name });

      signsList.push({
        loc,
        name,
        src,
        group,
      });
    });
  }

  return signsList;
}

export async function getMembers(): Promise<Set<string>> {
  const signsList = await getSigns();
  const members = new Set<string>();

  for (const sign of signsList) {
    if (
      sign.group === SignGroup.OverlayLight &&
      /^Name\s{1}/i.test(sign.name)
    ) {
      const name = sign.name.substring(sign.name.indexOf(' ') + 1);
      members.add(name);
    }
  }

  return members;
}
