import * as MENUS from 'constants/menus';

import { gql } from '@apollo/client';
import { BlogInfoFragment } from 'fragments/GeneralSettings';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  buildKeywordString,
  buildMetaDescription,
  formatProgramDisplayTitle,
  getSiteUrl,
  normalizeCanonicalUrl,
  pageTitle,
} from 'utilities';
import styles from 'styles/pages/_CoordinatorDirectory.module.scss';

import {
  Header,
  Footer,
  Main,
  ContentWrapper,
  EntryHeader,
  NavigationMenu,
  FeaturedImage,
  SEO,
} from '../components';

// Client-only form to avoid SSR/client mismatch.
const ContactForm = dynamic(() => import('components/ContactForm'), { ssr: false });

const TOKEN = '<!-- FORMSPREE_CONTACT -->';
const SLOT_HTML = '<div id="contact-form-slot"></div>';
const BLENDED_PROGRAM_DETAILS = {
  'aerospace engineering': {
    graduateTitle: 'Aerospace Engineering',
    bachelorsDegrees: ['Aerospace Engineering'],
  },
  'architectural engineering': {
    graduateTitle: 'Architectural Engineering',
    bachelorsDegrees: ['Architectural Engineering'],
  },
  'biomedical engineering': {
    graduateTitle: 'Biomedical Engineering',
    bachelorsDegrees: [
      'Biomedical Engineering',
      'Chemistry',
      'Computer Engineering, CPE',
      'Electrical Engineering',
      'Materials Engineering',
      'Mechanical Engineering',
    ],
  },
  'civil and environmental engineering': {
    graduateTitle: 'Civil & Environmental Engineering',
    bachelorsDegrees: ['Civil Engineering', 'Environmental Engineering'],
  },
  'computer science': {
    graduateTitle: 'Computer Science',
    bachelorsDegrees: [
      'Computer Engineering, CPE',
      'Computer Science, CSC',
      'Software Engineering, SE',
    ],
  },
  'electrical engineering': {
    graduateTitle: 'Electrical Engineering',
    bachelorsDegrees: ['Computer Engineering, CPE', 'Electrical Engineering'],
  },
  'engineering management': {
    graduateTitle: 'Engineering Management',
    bachelorsDegrees: [
      'Aerospace Engineering',
      'Biomedical Engineering',
      'Environmental Engineering',
      'Industrial Engineering',
      'Manufacturing Engineering',
      'Materials Engineering, MATE',
      'Mechanical Engineering',
      'Software Engineering, SE',
    ],
  },
  english: {
    graduateTitle: 'English',
    bachelorsDegrees: ['English'],
  },
  'food science': {
    graduateTitle: 'Food Science',
    bachelorsDegrees: ['Food Science'],
  },
  'industrial engineering': {
    graduateTitle: 'Industrial Engineering',
    bachelorsDegrees: [
      'Industrial Engineering',
      'Materials Engineering, MATE',
      'Mechanical Engineering',
    ],
  },
  mathematics: {
    graduateTitle: 'Mathematics',
    bachelorsDegrees: ['Mathematics'],
  },
  'mechanical engineering': {
    graduateTitle: 'Mechanical Engineering',
    bachelorsDegrees: ['Aerospace Engineering', 'Mechanical Engineering'],
  },
  nutrition: {
    graduateTitle: 'Nutrition',
    bachelorsDegrees: ['Nutrition'],
  },
  'polymers and coatings science': {
    graduateTitle: 'Polymers & Coatings Science',
    bachelorsDegrees: ['Chemistry', 'Biochemistry', 'Materials Engineering, MATE'],
  },
  'public policy': {
    graduateTitle: 'Masters of Public Policy',
    bachelorsDegrees: ['Political Science'],
  },
  statistics: {
    graduateTitle: 'Statistics',
    bachelorsDegrees: ['Statistics'],
  },
};

// Portals ContactForm into placeholder div after mount.
function ContactFormIntoSlot({ programOptions = [] }) {
  const [slot, setSlot] = useState(null);

  useEffect(() => {
    setSlot(document.getElementById('contact-form-slot'));
  }, []);

  if (!slot) return null;
  return createPortal(<ContactForm programOptions={programOptions} />, slot);
}

function normalize(value) {
  return String(value ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    )
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function firstNormalizedValue(value) {
  return toArray(value)
    .map((entry) => normalize(entry))
    .find(Boolean) || '';
}

function hasListValue(value, expected) {
  const normalizedExpected = normalize(expected).toLowerCase();
  return toArray(value).some(
    (entry) => normalize(entry).toLowerCase() === normalizedExpected
  );
}

function toTitleCase(value) {
  if (!value) return '';
  const minorWords = new Set(['and', 'or', 'of', 'the', 'in', 'for', 'to', 'a']);
  return String(value)
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (!word) return word;
      if (index > 0 && minorWords.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function formatCollegeDisplay(value) {
  const normalized = toTitleCase(normalize(value));
  return normalized.replace(/\(([^)]+)\)/g, (_, suffix) => {
    return `(${suffix.trim().toUpperCase()})`;
  });
}

function formatPhoneForHref(value = '') {
  return String(value).replace(/[^\d+]/g, '');
}

function splitMulti(value = '') {
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasRenderableContent(value = '') {
  const textOnly = String(value)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .trim();

  return Boolean(textOnly);
}

export default function Component(props) {
  const router = useRouter();
  const [coordinatorSearch, setCoordinatorSearch] = useState('');
  const [coordinatorCollegeFilter, setCoordinatorCollegeFilter] = useState('all');

  // Loading state for previews
  if (props.loading) {
    return <>Loading...</>;
  }

  const { title: siteTitle, description: siteDescription } =
    props?.data?.generalSettings;
  const primaryMenu = props?.data?.headerMenuItems?.nodes ?? [];

  const footerMenu   = props?.data?.footerMenuItems?.nodes ?? [];
  const aboutLinks   = props?.data?.aboutFooterMenuItems?.nodes ?? [];
  const navOne       = props?.data?.footerSecondaryMenuItems?.nodes ?? [];
  const navTwo       = props?.data?.footerTertiaryMenuItems?.nodes ?? [];
  const resources    = props?.data?.resourcesFooterMenuItems?.nodes ?? [];

  const page = props?.data?.page ?? { title: '' };
  const { title, content, featuredImage, seo: s, uri } = page;
  const normalizedUri = String(uri ?? '').replace(/\/+$/, '');
  const isCoordinatorPage =
    normalizedUri === '/graduate-program-coordinators';
  const isBlendedProgramsPage = normalizedUri === '/blended-programs';
  const isCertificateProgramsPage =
    normalizedUri === '/graduate-certificate-programs';
  const programNodes = props?.data?.programs?.nodes ?? [];

  const coordinatorPrograms = useMemo(() => {
    return programNodes
      .map((program) => {
        const fields = program?.programFields ?? {};
        const displayTitle = formatProgramDisplayTitle(
          normalize(program?.title),
          fields.specialization,
          fields.specializationIn
        );
        return {
          title: displayTitle,
          uri: normalize(program?.uri),
          college: formatCollegeDisplay(fields.college) || 'Other Programs',
          coordinator: normalize(fields.contactName),
          contact: normalize(fields.contactEmail),
          phone: normalize(fields.contactPhone),
        };
      })
      .filter(
        (program) =>
          program.title && (program.coordinator || program.contact || program.phone)
      )
      .sort((a, b) =>
        a.title.localeCompare(b.title, undefined, {
          sensitivity: 'base',
        })
      );
  }, [programNodes]);
  const coordinatorCollegeOptions = useMemo(() => {
    const colleges = new Set(coordinatorPrograms.map((program) => program.college));
    return Array.from(colleges).sort((a, b) => a.localeCompare(b));
  }, [coordinatorPrograms]);
  const filteredCoordinatorPrograms = useMemo(() => {
    const normalizedSearch = coordinatorSearch.trim().toLowerCase();

    return coordinatorPrograms.filter((program) => {
      const searchable = [
        program.title,
        program.college,
        program.coordinator,
        program.contact,
        program.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchable.includes(normalizedSearch);
      const matchesCollege =
        coordinatorCollegeFilter === 'all' ||
        program.college === coordinatorCollegeFilter;

      return matchesSearch && matchesCollege;
    });
  }, [coordinatorPrograms, coordinatorSearch, coordinatorCollegeFilter]);
  const groupedByCollege = useMemo(() => {
    const grouped = filteredCoordinatorPrograms.reduce((acc, program) => {
      if (!acc[program.college]) acc[program.college] = [];
      acc[program.college].push(program);
      return acc;
    }, {});

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredCoordinatorPrograms]);
  const blendedProgramsByCollege = useMemo(() => {
    const grouped = programNodes.reduce((acc, program) => {
      const fields = program?.programFields ?? {};

      if (!hasListValue(fields.programType, 'blended')) {
        return acc;
      }

      const titleKey = normalize(program?.title).toLowerCase();
      const details = BLENDED_PROGRAM_DETAILS[titleKey] ?? {};
      const college =
        formatCollegeDisplay(firstNormalizedValue(fields.college)) || 'Other Programs';
      const displayTitle =
        details.graduateTitle ||
        formatProgramDisplayTitle(
          normalize(program?.title),
          fields.specialization,
          fields.specializationIn
        );

      if (!acc[college]) {
        acc[college] = [];
      }

      acc[college].push({
        title: displayTitle,
        uri: normalize(program?.uri),
        coordinator: normalize(fields.contactName),
        contact: normalize(fields.contactEmail),
        phone: normalize(fields.contactPhone),
        bachelorsDegrees: details.bachelorsDegrees ?? [],
      });

      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([college, programs]) => [
        college,
        [...programs].sort((a, b) =>
          a.title.localeCompare(b.title, undefined, {
            sensitivity: 'base',
          })
        ),
      ]);
  }, [programNodes]);
  const certificateProgramsByCollege = useMemo(() => {
    const grouped = programNodes.reduce((acc, program) => {
      const fields = program?.programFields ?? {};

      if (!hasListValue(fields.programType, 'certificate')) {
        return acc;
      }

      const college =
        formatCollegeDisplay(firstNormalizedValue(fields.college)) || 'Other Programs';
      const displayTitle = formatProgramDisplayTitle(
        normalize(program?.title),
        fields.specialization,
        fields.specializationIn
      );

      if (!acc[college]) {
        acc[college] = [];
      }

      acc[college].push({
        title: displayTitle,
        uri: normalize(program?.uri),
        coordinator: normalize(fields.contactName),
        contact: normalize(fields.contactEmail),
        phone: normalize(fields.contactPhone),
      });

      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([college, programs]) => [
        college,
        [...programs].sort((a, b) =>
          a.title.localeCompare(b.title, undefined, {
            sensitivity: 'base',
          })
        ),
      ]);
  }, [programNodes]);
  const contactProgramOptions = Array.from(
    new Set(
      programNodes
        .map((program) => normalize(program?.title))
        .filter((title) => title && !title.toLowerCase().includes('suspended'))
    )
  )
    .sort((a, b) =>
      a.localeCompare(b, undefined, {
        sensitivity: 'base',
      })
    );
  const htmlWithSlot = (content ?? '').split(TOKEN).join(SLOT_HTML);
  const showContentWrapper = htmlWithSlot.includes(SLOT_HTML) || hasRenderableContent(content);

  // ---- Yoast → SEO props with smart fallbacks ----
  const computedTitle =
    s?.title ||
    pageTitle(props?.data?.generalSettings, title, props?.data?.generalSettings?.title);

  const computedDescription =
    s?.metaDesc ||
    buildMetaDescription({
      title,
      content,
      fallback:
        siteDescription || 'Official site for Cal Poly Graduate Education.',
    });
  const computedKeywords = buildKeywordString({
    title,
    content,
    seedKeywords: ['graduate education', 'cal poly'],
  });

  const computedImageUrl =
    s?.opengraphImage?.mediaItemUrl ||
    featuredImage?.node?.sourceUrl ||
    '/images/og-default.jpg';

  const baseUrl = getSiteUrl();
  let canonicalPath = router?.asPath;

  if (s?.canonical) {
    try {
      canonicalPath = new URL(s.canonical, baseUrl).pathname;
    } catch {
      canonicalPath = s.canonical;
    }
  }

  const computedCanonical = normalizeCanonicalUrl(canonicalPath, baseUrl);



  const ogType = s?.opengraphType || 'website';
  const ogSiteName = s?.opengraphSiteName || siteTitle;

  return (
    <>
      <SEO
        title={computedTitle}
        description={computedDescription}
        keywords={computedKeywords}
        imageUrl={computedImageUrl}
        url={computedCanonical}
        type={ogType}
        siteName={ogSiteName}
      />

      <Header
        title={siteTitle}
        description={siteDescription}
        menuItems={primaryMenu}
      />
      <Main>
        <>
          <EntryHeader title={title} image={featuredImage?.node} />
          <div className="container">
            {showContentWrapper && <ContentWrapper content={htmlWithSlot} />}
            {isCertificateProgramsPage && certificateProgramsByCollege.length > 0 && (
              <section className={styles.directorySection}>
                <h2 className={styles.sectionTitle}>Graduate Certificate Programs</h2>
                {certificateProgramsByCollege.map(([college, programs]) => (
                  <div key={college} className={styles.collegeBlock}>
                    <h3 className={styles.collegeTitle}>{college}</h3>
                    <div className={styles.tableWrap}>
                      <table className={styles.directoryTable}>
                        <thead>
                          <tr>
                            <th>Program</th>
                            <th>Coordinator</th>
                            <th>Contact</th>
                            <th>Phone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {programs.map((program) => (
                            <tr key={`${college}-${program.title}`}>
                              <td data-label="Program">
                                {program.uri ? (
                                  <a href={program.uri}>{program.title}</a>
                                ) : (
                                  program.title
                                )}
                              </td>
                              <td data-label="Coordinator">
                                {splitMulti(program.coordinator).length ? (
                                  splitMulti(program.coordinator).map((name) => (
                                    <span
                                      key={`${program.title}-${name}`}
                                      className={styles.multiLineValue}
                                    >
                                      {name}
                                    </span>
                                  ))
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td data-label="Contact">
                                {splitMulti(program.contact).length ? (
                                  splitMulti(program.contact).map((email) => (
                                    <span
                                      key={`${program.title}-${email}`}
                                      className={styles.multiLineValue}
                                    >
                                      <a href={`mailto:${email}`}>{email}</a>
                                    </span>
                                  ))
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td data-label="Phone">
                                {splitMulti(program.phone).length ? (
                                  splitMulti(program.phone).map((phone) => (
                                    <span
                                      key={`${program.title}-${phone}`}
                                      className={styles.multiLineValue}
                                    >
                                      <a href={`tel:${formatPhoneForHref(phone)}`}>
                                        {phone}
                                      </a>
                                    </span>
                                  ))
                                ) : (
                                  '-'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </section>
            )}
            {isBlendedProgramsPage && blendedProgramsByCollege.length > 0 && (
              <section className={styles.directorySection}>
                <h2 className={styles.sectionTitle}>Approved Blended Paired Programs</h2>
                {blendedProgramsByCollege.map(([college, programs]) => (
                  <div key={college} className={styles.collegeBlock}>
                    <h3 className={styles.collegeTitle}>{college}</h3>
                    <div className={styles.tableWrap}>
                      <table className={styles.directoryTable}>
                        <thead>
                          <tr>
                            <th>Program</th>
                            <th>Coordinator</th>
                            <th>Contact</th>
                            <th>Phone</th>
                            <th>Bachelor&apos;s Degree</th>
                          </tr>
                        </thead>
                        <tbody>
                          {programs.map((program) => (
                            <tr key={`${college}-${program.title}`}>
                              <td data-label="Graduate Program">
                                {program.uri ? (
                                  <a href={program.uri}>{program.title}</a>
                                ) : (
                                  program.title
                                )}
                              </td>
                              <td data-label="Coordinator">
                                {splitMulti(program.coordinator).length ? (
                                  splitMulti(program.coordinator).map((name) => (
                                    <span
                                      key={`${program.title}-${name}`}
                                      className={styles.multiLineValue}
                                    >
                                      {name}
                                    </span>
                                  ))
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td data-label="Contact">
                                {splitMulti(program.contact).length ? (
                                  splitMulti(program.contact).map((email) => (
                                    <span
                                      key={`${program.title}-${email}`}
                                      className={styles.multiLineValue}
                                    >
                                      <a href={`mailto:${email}`}>{email}</a>
                                    </span>
                                  ))
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td data-label="Phone">
                                {splitMulti(program.phone).length ? (
                                  splitMulti(program.phone).map((phone) => (
                                    <span
                                      key={`${program.title}-${phone}`}
                                      className={styles.multiLineValue}
                                    >
                                      <a href={`tel:${formatPhoneForHref(phone)}`}>
                                        {phone}
                                      </a>
                                    </span>
                                  ))
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td data-label="Required Bachelor's Degree">
                                {program.bachelorsDegrees.length > 0 ? (
                                  program.bachelorsDegrees.map((degree) => (
                                    <span
                                      key={`${program.title}-${degree}`}
                                      className={styles.multiLineValue}
                                    >
                                      {degree}
                                    </span>
                                  ))
                                ) : (
                                  '-'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </section>
            )}
            {/* Contact form temporarily disabled. Re-enable when needed. */}
            {/* <ContactFormIntoSlot programOptions={contactProgramOptions} /> */}
            {isCoordinatorPage && (
              <section className={styles.directorySection}>
                <section className={styles.filters}>
                  <h2 className={styles.filtersTitle}>Find a Coordinator</h2>
                  <div className={styles.filterGrid}>
                    <label className={styles.filterField}>
                      <span>Search</span>
                      <input
                        type="search"
                        value={coordinatorSearch}
                        onChange={(event) => setCoordinatorSearch(event.target.value)}
                        placeholder="Program, coordinator, contact, or phone"
                      />
                    </label>
                    <label className={styles.filterField}>
                      <span>College</span>
                      <select
                        value={coordinatorCollegeFilter}
                        onChange={(event) =>
                          setCoordinatorCollegeFilter(event.target.value)
                        }
                      >
                        <option value="all">All colleges</option>
                        {coordinatorCollegeOptions.map((college) => (
                          <option key={college} value={college}>
                            {college}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className={styles.resultCount}>
                    Showing {filteredCoordinatorPrograms.length} of {coordinatorPrograms.length} programs
                  </p>
                </section>
                {/* <h2 className={styles.directoryTitle}>Graduate Program Coordinators</h2> */}
                {filteredCoordinatorPrograms.length === 0 && (
                  <p className={styles.noResults}>
                    No coordinators matched your search or selected college.
                  </p>
                )}
                {groupedByCollege.map(([college, programs]) => (
                  <div key={college} className={styles.collegeBlock}>
                    <h3 className={styles.collegeTitle}>{college}</h3>
                    <div className={styles.tableWrap}>
                      <table className={styles.directoryTable}>
                        <thead>
                          <tr>
                            <th>Program</th>
                            <th>Coordinator</th>
                            <th>Contact</th>
                            <th>Phone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {programs.map((program) => (
                            <tr key={`${college}-${program.title}`}>
                              <td data-label="Program">
                                {program.uri ? <a href={program.uri}>{program.title}</a> : program.title}
                              </td>
                              <td data-label="Coordinator">
                                {splitMulti(program.coordinator).length ? (
                                  splitMulti(program.coordinator).map((name) => (
                                    <span key={`${program.title}-${name}`} className={styles.multiLineValue}>
                                      {name}
                                    </span>
                                  ))
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td data-label="Contact">
                                {splitMulti(program.contact).length ? (
                                  splitMulti(program.contact).map((email) => (
                                    <span key={`${program.title}-${email}`} className={styles.multiLineValue}>
                                      <a href={`mailto:${email}`}>{email}</a>
                                    </span>
                                  ))
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td data-label="Phone">
                                {splitMulti(program.phone).length ? (
                                  splitMulti(program.phone).map((phone) => (
                                    <span key={`${program.title}-${phone}`} className={styles.multiLineValue}>
                                      <a href={`tel:${formatPhoneForHref(phone)}`}>
                                        {phone}
                                      </a>
                                    </span>
                                  ))
                                ) : (
                                  '-'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </div>
        </>
      </Main>
      <Footer
        title={siteTitle}
        menuItems={footerMenu}               // fallback resources source (FOOTER)
        navOneMenuItems={navOne}              // middle: Footer Secondary
        navTwoMenuItems={navTwo}              // right: Footer Tertiary
        resourcesMenuItems={resources}        // new Resources block
        aboutMenuItems={aboutLinks}
      />
    </>
  );
}

Component.variables = ({ databaseId, uri }, ctx) => {
  const fallbackFooterLocation = MENUS.FOOTER_LOCATION ?? null;
  const normalizedUri = String(uri ?? ctx?.uri ?? '').replace(/\/+$/, '');
  const includePrograms = new Set([
    '/graduate-program-coordinators',
    '/blended-programs',
    '/graduate-certificate-programs',
  ]).has(normalizedUri);

  return {
    databaseId,
    headerLocation: MENUS.PRIMARY_LOCATION,
    // was FOOTER_LOCATION — stop using it
    footerLocation: fallbackFooterLocation,
    quickFooterLocation: MENUS.QUICK_FOOTER_LOCATION ?? fallbackFooterLocation,
    aboutFooterLocation: MENUS.ABOUT_FOOTER_LOCATION ?? fallbackFooterLocation,
    footerSecondaryLocation:
      MENUS.FOOTER_SECONDARY_LOCATION ?? fallbackFooterLocation,
    footerTertiaryLocation:
      MENUS.FOOTER_TERTIARY_LOCATION ?? fallbackFooterLocation,
    resourcesFooterLocation:
      MENUS.RESOURCES_FOOTER_LOCATION ?? fallbackFooterLocation,
    includePrograms,
    asPreview: ctx?.asPreview,
  };
};

Component.query = gql`
  ${BlogInfoFragment}
  ${NavigationMenu.fragments.entry}
  ${FeaturedImage.fragments.entry}
  query GetPageData(
    $databaseId: ID!
    $headerLocation: MenuLocationEnum
    $footerLocation: MenuLocationEnum
    $quickFooterLocation: MenuLocationEnum
    $aboutFooterLocation: MenuLocationEnum
    $footerSecondaryLocation: MenuLocationEnum
    $footerTertiaryLocation: MenuLocationEnum
    $resourcesFooterLocation: MenuLocationEnum
    $includePrograms: Boolean = false
    $asPreview: Boolean = false
  ) {
    page(id: $databaseId, idType: DATABASE_ID, asPreview: $asPreview) {
      title
      content
      uri
      ...FeaturedImageFragment
      seo {
        title
        metaDesc
        canonical
        opengraphType
        opengraphSiteName
        opengraphImage {
          mediaItemUrl
        }
        metaRobotsNoindex
        metaRobotsNofollow
      }
    }
    programs(first: 500) @include(if: $includePrograms) {
      nodes {
        uri
        title
        programFields {
          college
          programType
          specialization
          specializationIn
          contactName
          contactEmail
          contactPhone
        }
      }
    }
    generalSettings {
      ...BlogInfoFragment
    }
    headerMenuItems: menuItems(where: { location: $headerLocation }, first: 100) {
      nodes {
        ...NavigationMenuItemFragment
      }
    }
    footerMenuItems: menuItems(where: { location: $footerLocation }, first: 100) {
      nodes { ...NavigationMenuItemFragment }
    }
    quickFooterMenuItems: menuItems(where: { location: $quickFooterLocation }, first: 100) {
      nodes { ...NavigationMenuItemFragment }
    }
    aboutFooterMenuItems: menuItems(where: { location: $aboutFooterLocation }, first: 100) {
      nodes { ...NavigationMenuItemFragment }
    }
    footerSecondaryMenuItems: menuItems(where: { location: $footerSecondaryLocation }, first: 100) {
      nodes { ...NavigationMenuItemFragment }
    }
    footerTertiaryMenuItems: menuItems(where: { location: $footerTertiaryLocation }, first: 100) {
      nodes { ...NavigationMenuItemFragment }
    }
    resourcesFooterMenuItems: menuItems(where: { location: $resourcesFooterLocation }, first: 100) {
      nodes { ...NavigationMenuItemFragment }
    }
  }
`;
