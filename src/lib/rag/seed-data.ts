export type BarangayProfile = {
  name: string
  municipality: string
  province: string
  elevation: number
  coastal_proximity: number
  river_basin: string
  historical_flood_extent: string
  evacuation_centers: string[]
  profileText: string
}

export type DisasterRecord = {
  barangayName: string
  event_name: string
  event_type: string
  date_occurred: string
  severity: string
  conditions: string
  impact: string
}

export type Ndrrmc = {
  alert_level: string
  protocol_text: string
  recommended_actions: string[]
}

export const BARANGAY_PROFILES: BarangayProfile[] = [
  {
    name: 'Pag-asa',
    municipality: 'Quezon City',
    province: 'Metro Manila',
    elevation: 25,
    coastal_proximity: 15,
    river_basin: 'Marikina River Basin',
    historical_flood_extent: 'low',
    evacuation_centers: ['Pag-asa Elementary School', 'Pag-asa Covered Court'],
    profileText:
      'Barangay Pag-asa is located in Quezon City, Metro Manila at an elevation of 25 meters above sea level. It lies 15 kilometers from the nearest coastline within the Marikina River Basin. The barangay has a low historical flood extent, benefiting from its relatively higher elevation compared to nearby riverside communities. Designated evacuation centers include Pag-asa Elementary School and Pag-asa Covered Court.',
  },
  {
    name: 'San Roque',
    municipality: 'Marikina City',
    province: 'Metro Manila',
    elevation: 12,
    coastal_proximity: 20,
    river_basin: 'Marikina River Basin',
    historical_flood_extent: 'high',
    evacuation_centers: ['San Roque Elementary School', 'Marikina Sports Center'],
    profileText:
      'Barangay San Roque is located in Marikina City, Metro Manila at an elevation of only 12 meters above sea level. It lies 20 kilometers from the coast within the Marikina River Basin and is situated immediately adjacent to the Marikina River. The barangay has a high historical flood extent due to its low elevation and proximity to the river. During major typhoon events, flood waters can reach 2 to 5 meters. Designated evacuation centers include San Roque Elementary School and the Marikina Sports Center.',
  },
  {
    name: 'Poblacion',
    municipality: 'Palo',
    province: 'Leyte',
    elevation: 3,
    coastal_proximity: 0.5,
    river_basin: 'Leyte Gulf Watershed',
    historical_flood_extent: 'critical',
    evacuation_centers: ['Poblacion Elementary School', 'Leyte Capitol'],
    profileText:
      'Barangay Poblacion is located in Palo, Leyte at a critically low elevation of 3 meters above sea level with only 0.5 kilometers from the Leyte Gulf coastline. It falls within the Leyte Gulf Watershed and is classified as a critical storm surge risk zone. The barangay has a high historical flood extent from multiple typhoon events including catastrophic inundation during Typhoon Haiyan in 2013. Storm surge risk is extreme during strong typhoons making early evacuation essential. Designated evacuation centers include Poblacion Elementary School and Leyte Capitol.',
  },
]

export const DISASTER_RECORDS: DisasterRecord[] = [
  // Pag-asa records — Typhoon Ondoy 2009
  {
    barangayName: 'Pag-asa',
    event_name: 'Typhoon Ondoy (Ketsana)',
    event_type: 'typhoon',
    date_occurred: '2009-09-26T00:00:00Z',
    severity: 'moderate',
    conditions:
      'Sustained rainfall of over 455mm in 6 hours overwhelmed the Marikina River Basin drainage system. Winds reached 65 km/h with gusts up to 85 km/h. The Marikina River crested at 22 meters above normal levels.',
    impact:
      'Barangay Pag-asa experienced localised street flooding reaching 0.5 to 1 meter depth in low-lying sections near drainage canals. Approximately 120 households were affected. No casualties recorded within the barangay. Floodwaters receded within 12 hours due to the higher elevation relative to adjacent riverside barangays.',
  },
  {
    barangayName: 'Pag-asa',
    event_name: 'Typhoon Pedring (Nesat)',
    event_type: 'typhoon',
    date_occurred: '2011-09-27T00:00:00Z',
    severity: 'low',
    conditions:
      'Heavy rainfall accompanying Typhoon Pedring produced localized flooding. Marikina River reached 19 meters. Winds sustained at 60 km/h.',
    impact:
      'Minor street flooding in low-lying portions of the barangay. No evacuation required. Community infrastructure remained intact. Approximately 35 households reported water entry into ground floors.',
  },
  {
    barangayName: 'Pag-asa',
    event_name: 'Habagat Monsoon Enhancement 2012',
    event_type: 'flood',
    date_occurred: '2012-08-07T00:00:00Z',
    severity: 'moderate',
    conditions:
      'Southwest monsoon enhanced by Typhoon Haikui produced four consecutive days of heavy rainfall. Cumulative rainfall exceeded 600mm over 72 hours in Metro Manila.',
    impact:
      'Sustained flooding up to 1.2 meters in parts of Pag-asa for approximately 48 hours. Around 200 families temporarily displaced to evacuation centers. No fatalities. Agricultural plots and ground-floor commercial units suffered damage.',
  },
  // San Roque records — Typhoon Ondoy 2009
  {
    barangayName: 'San Roque',
    event_name: 'Typhoon Ondoy (Ketsana)',
    event_type: 'typhoon',
    date_occurred: '2009-09-26T00:00:00Z',
    severity: 'catastrophic',
    conditions:
      'Typhoon Ondoy delivered the highest single-day rainfall recorded in Philippine history at the time. The Marikina River rose to 22.57 meters, far exceeding the 15-meter critical level. Floodwaters rose at a rate of 1 meter per hour leaving little time for evacuation.',
    impact:
      'Barangay San Roque experienced catastrophic flooding with water levels reaching 4.5 meters in the most affected zones. Over 1,800 families were displaced. Three fatalities were recorded within the barangay. Floodwaters remained for 72 hours. Ground floors of permanent structures were completely submerged. Total estimated damage to property and livelihoods exceeded PHP 85 million.',
  },
  {
    barangayName: 'San Roque',
    event_name: 'Typhoon Ondoy Recovery Flooding',
    event_type: 'flood',
    date_occurred: '2009-10-03T00:00:00Z',
    severity: 'high',
    conditions:
      'Residual flooding from the saturated Marikina River Basin combined with continued precipitation from Typhoon Parma. River levels remained elevated at 18 meters for five additional days.',
    impact:
      'Re-flooding of previously drained areas prevented return of displaced families. An additional 400 families required continued evacuation support. Damage to relief operations and ongoing infrastructure restoration work.',
  },
  {
    barangayName: 'San Roque',
    event_name: 'Habagat Monsoon Enhancement 2012',
    event_type: 'flood',
    date_occurred: '2012-08-07T00:00:00Z',
    severity: 'high',
    conditions:
      'Southwest monsoon enhanced by Typhoon Haikui. Marikina River reached 20 meters. Five days of continuous heavy rainfall with 700mm cumulative total.',
    impact:
      'Major flooding with water levels reaching 3 meters in riverside sections of San Roque. Approximately 1,200 families evacuated. Two fatalities due to drowning. Significant damage to homes and barangay infrastructure. Floodwaters receded after 60 hours.',
  },
  // Poblacion Leyte records — Typhoon Haiyan 2013
  {
    barangayName: 'Poblacion',
    event_name: 'Typhoon Haiyan (Yolanda)',
    event_type: 'typhoon',
    date_occurred: '2013-11-08T00:00:00Z',
    severity: 'catastrophic',
    conditions:
      'Typhoon Haiyan made landfall with sustained winds of 315 km/h and gusts up to 380 km/h. Storm surge in the Leyte Gulf reached 5 to 7 meters above normal sea level, penetrating up to 1 kilometer inland. The combination of storm surge and extreme winds caused unprecedented destruction.',
    impact:
      'Barangay Poblacion suffered near-total destruction. Storm surge inundated the entire barangay to a depth of 4 to 6 meters within minutes of Haiyan landfall. Over 95% of structures were destroyed or severely damaged. The barangay recorded 47 fatalities with an additional 23 residents missing. All evacuation centers within the barangay were destroyed. The community required full reconstruction with international disaster relief support.',
  },
  {
    barangayName: 'Poblacion',
    event_name: 'Typhoon Ruby (Hagupit)',
    event_type: 'typhoon',
    date_occurred: '2014-12-06T00:00:00Z',
    severity: 'high',
    conditions:
      'Typhoon Ruby approached Leyte with maximum sustained winds of 175 km/h. Storm surge warning Signal No. 4 was raised. The typhoon made landfall near Eastern Samar before tracking toward Leyte Gulf.',
    impact:
      'Pre-emptive mandatory evacuation of all coastal barangays in Palo, Leyte was conducted. Barangay Poblacion was fully evacuated before typhoon arrival. Storm surge reached 2.5 meters, flooding evacuated structures but preventing casualties. Damage to infrastructure and ongoing rehabilitation efforts from Haiyan reconstruction was significant.',
  },
  {
    barangayName: 'Poblacion',
    event_name: 'Typhoon Odette (Rai)',
    event_type: 'typhoon',
    date_occurred: '2021-12-16T00:00:00Z',
    severity: 'high',
    conditions:
      'Typhoon Odette made landfall in Surigao del Norte before crossing Leyte as a strong typhoon with winds of 185 km/h. Storm surge of 2 to 3 meters was generated along the Leyte Gulf coast.',
    impact:
      'Mandatory evacuation was implemented 24 hours before landfall. Storm surge flooded ground floors of rebuilt structures in Barangay Poblacion. One fatality due to failure to evacuate. Significant damage to coastal infrastructure, fishing boats, and newly rebuilt community facilities. Power and communications were disrupted for 18 days.',
  },
]

export const NDRRMC_PROTOCOLS: Ndrrmc[] = [
  {
    alert_level: 'SAFE',
    protocol_text:
      'Alert Level SAFE indicates current environmental conditions pose no significant hazard to the community. Standard monitoring and preparedness activities are maintained. Community members may conduct normal activities while remaining aware of weather forecasts. Local Disaster Risk Reduction and Management Office (LDRRMO) maintains routine monitoring of rainfall, river levels, and weather advisories from PAGASA.',
    recommended_actions: [
      'Monitor official PAGASA weather bulletins every 6 hours',
      'Ensure emergency contact lists are updated and accessible',
      'Inspect and maintain household drainage systems',
      'Review family emergency plans and evacuation routes',
      'Maintain a 3-day emergency supply of food and water',
      'Keep mobile phones charged and emergency numbers saved',
      'Report any unusual environmental observations to the barangay hall',
    ],
  },
  {
    alert_level: 'MODERATE RISK',
    protocol_text:
      'Alert Level MODERATE RISK indicates elevated environmental hazard conditions requiring increased vigilance and preparedness actions. PAGASA has issued a weather advisory or tropical cyclone warning signal is in effect. River levels may be approaching warning thresholds. Community members should prepare for possible evacuation. LDRRMO activates the Emergency Operations Center and pre-positions relief goods. Vulnerable populations including elderly, persons with disabilities, pregnant women, and young children should begin voluntary evacuation to designated centers.',
    recommended_actions: [
      'Activate barangay Emergency Operations Center and Disaster Risk Reduction Council',
      'Issue public advisory through barangay public address system every 2 hours',
      'Begin voluntary evacuation of vulnerable populations to designated evacuation centers',
      'Pre-position emergency response teams and equipment at strategic locations',
      'Coordinate with city or municipal DRRMO for additional resources',
      'Ensure evacuation centers are open, supplied, and staffed',
      'Monitor river levels and rainfall every hour',
      'Prepare go-bags with essential documents, food, water, and medicine',
      'Secure or move livestock and movable property to higher ground',
      'Stay indoors during heavy rainfall and avoid crossing flooded roads',
    ],
  },
  {
    alert_level: 'EVACUATE NOW',
    protocol_text:
      'Alert Level EVACUATE NOW indicates imminent or ongoing life-threatening hazard requiring immediate mandatory evacuation. This level is declared when storm surge warning is in effect, river levels exceed critical thresholds, or structural failure of flood control infrastructure is imminent. Remaining in place presents a severe risk of death or serious injury. All barangay residents must evacuate immediately to designated evacuation centers using pre-identified safe routes. Law enforcement and barangay officials are authorized to enforce mandatory evacuation. LDRRMO coordinates with higher-level DRRMO for search and rescue assets.',
    recommended_actions: [
      'Declare mandatory evacuation immediately and broadcast continuously through all available channels',
      'Deploy barangay emergency response teams to assist mobility-limited residents',
      'Coordinate with police and military for forced evacuation if residents refuse',
      'Activate search and rescue teams and deploy to high-risk zones',
      'Close all roads leading to flood-prone and storm surge areas',
      'Report all missing persons to the DRRMO hotline immediately',
      'Move to designated evacuation centers only — do not use alternative routes without clearance',
      'Do not return home until LDRRMO issues official all-clear signal',
      'Report injuries or trapped persons to barangay emergency hotline immediately',
      'Follow all instructions from LDRRMO, police, and emergency response personnel',
    ],
  },
]
