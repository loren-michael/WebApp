import withStyles from '@mui/styles/withStyles';
import { filter } from 'lodash-es';
import PropTypes from 'prop-types';
import React, { Component, Suspense } from 'react';
import styled from 'styled-components';
import { convertStateCodeToStateText } from '../../utils/addressFunctions';
import { getTodayAsInteger, getYearFromUltimateElectionDate } from '../../utils/dateFormat';
import { renderLog } from '../../utils/logging';
import CampaignStore from '../../stores/CampaignStore';
import CampaignSupporterStore from '../../stores/CampaignSupporterStore';

const CampaignCardList = React.lazy(() => import(/* webpackChunkName: 'CampaignCardList' */ './CampaignCardList'));
const FirstCampaignListController = React.lazy(() => import(/* webpackChunkName: 'FirstCampaignListController' */ './FirstCampaignListController'));

class CampaignListRoot extends Component {
  constructor (props) {
    super(props);
    this.state = {
      campaignList: [],
      campaignSearchResults: [],
      filteredCampaignList: [],
      timeStampOfChange: 0,
    };
  }

  componentDidMount () {
    // console.log('CampaignListRoot componentDidMount');
    this.campaignSupporterStoreListener = CampaignSupporterStore.addListener(this.onCampaignSupporterStoreChange.bind(this));
    this.campaignStoreListener = CampaignStore.addListener(this.onCampaignStoreChange.bind(this));
    this.onIncomingListChange();
  }

  componentDidUpdate (prevProps) {
    let changeNeeded = false;
    if (this.props.listModeFiltersTimeStampOfChange !== prevProps.listModeFiltersTimeStampOfChange) {
      changeNeeded = true;
    }
    if (this.props.searchText !== prevProps.searchText) {
      changeNeeded = true;
    }
    if (changeNeeded) {
      this.onFilterOrListChange();
    }
  }

  componentWillUnmount () {
    this.campaignSupporterStoreListener.remove();
    this.campaignStoreListener.remove();
  }

  onCampaignSupporterStoreChange () {
    // We need to instantiate CampaignSupporterStore before we call campaignListRetrieve so that store gets filled with data
  }

  onCampaignStoreChange () {
    this.onIncomingListChange();
  }

  onIncomingListChange () {
    const campaignList = CampaignStore.getPromotedCampaignXDicts();
    // console.log('campaignList:', campaignList);
    this.setState({
      campaignList,
    }, () => this.onFilterOrListChange());
  }

  orderByAlphabetical = (firstEntry, secondEntry) => {
    let firstEntryName;
    let secondEntryName = 'x';
    if (firstEntry && firstEntry.campaign_title) {
      firstEntryName = firstEntry.campaign_title;
    }
    if (secondEntry && secondEntry.campaign_title) {
      secondEntryName = secondEntry.campaign_title;
    }
    if (firstEntryName < secondEntryName) { return -1; }
    if (firstEntryName > secondEntryName) { return 1; }
    return 0;
  };

  // Order by 1, 2, 3. Push 0's to the bottom in the same order.
  orderByOrderInList = (firstCampaign, secondCampaign) => (firstCampaign.order_in_list || Number.MAX_VALUE) - (secondCampaign.order_in_list || Number.MAX_VALUE);

  orderBySupportersCount = (firstCampaign, secondCampaign) => secondCampaign.supporters_count - firstCampaign.supporters_count;

  onFilterOrListChange = () => {
    // console.log('onFilterOrListChange');
    // Start over with full campaignList, and apply all active filters
    const { listModeFilters, searchText } = this.props;
    const { campaignList } = this.state;
    // console.log('campaignList:', campaignList);
    let filteredCampaignList = campaignList;
    if (listModeFilters && listModeFilters.length > 0) {
      const todayAsInteger = getTodayAsInteger();
      listModeFilters.forEach((oneFilter) => {
        // console.log('oneFilter:', oneFilter);
        if ((oneFilter.filterType === 'showUpcomingEndorsements') && (oneFilter.filterSelected === true)) {
          filteredCampaignList = filteredCampaignList.filter((oneCampaign) => oneCampaign.final_election_date_as_integer >= todayAsInteger);
        }
        if ((oneFilter.filterType === 'showYear') && (oneFilter.filterSelected === true)) {
          filteredCampaignList = filteredCampaignList.filter((oneCampaign) => getYearFromUltimateElectionDate(oneCampaign.final_election_date_as_integer) === oneFilter.filterYear);
        }
      });
    }
    const filteredCampaignListModified = [];
    let modifiedCampaign;
    filteredCampaignList.forEach((oneCampaign) => {
      modifiedCampaign = { ...oneCampaign };
      modifiedCampaign = {
        ...modifiedCampaign,
        campaign_state_name: convertStateCodeToStateText(oneCampaign.state_code),
        state_code: oneCampaign.state_code || '',
      };
      if (!oneCampaign.campaign_description) {
        modifiedCampaign = {
          ...modifiedCampaign,
          campaign_description: '',
        };
      }
      if (!oneCampaign.campaign_title) {
        modifiedCampaign = {
          ...modifiedCampaign,
          campaign_title: '',
        };
      }
      if (!oneCampaign.contest_office_name) {
        modifiedCampaign = {
          ...modifiedCampaign,
          contest_office_name: '',
        };
      }
      filteredCampaignListModified.push(modifiedCampaign);
    });
    filteredCampaignList = filteredCampaignListModified;
    // We need to add support for ballot_item_twitter_followers_count
    // filteredCampaignList = filteredCampaignList.sort(this.orderPositionsByBallotItemTwitterFollowers);
    filteredCampaignList = filteredCampaignList.sort(this.orderByAlphabetical);
    filteredCampaignList = filteredCampaignList.sort(this.orderBySupportersCount);
    filteredCampaignList = filteredCampaignList.sort(this.orderByOrderInList);
    let campaignSearchResults = [];
    if (searchText && searchText.length > 0) {
      const searchTextLowercase = searchText.toLowerCase();
      // console.log('searchTextLowercase:', searchTextLowercase);
      const searchWordArray = searchTextLowercase.match(/\b(\w+)\b/g);
      // console.log('searchWordArray:', searchWordArray);
      let foundInThisCampaign;
      let foundInThisCampaignsPoliticians;
      let isFirstWord;
      let politicianStateName;
      let thisWordFound;
      campaignSearchResults = filter(filteredCampaignList,
        (oneCampaign) => {
          foundInThisCampaign = false;
          isFirstWord = true;
          searchWordArray.forEach((oneSearchWordLowerCase) => {
            thisWordFound = (
              // We should add these fields on API server:
              // oneCampaign.state_code.toLowerCase().includes(oneSearchWordLowerCase) ||
              // oneCampaign.campaign_state_name.toLowerCase().includes(oneSearchWordLowerCase) ||
              oneCampaign.campaign_description.toLowerCase().includes(oneSearchWordLowerCase) ||
              oneCampaign.campaign_title.toLowerCase().includes(oneSearchWordLowerCase)
            );
            if (!thisWordFound) {
              foundInThisCampaignsPoliticians = false;
              // Go on to search in the campaignx_politician_list
              if (oneCampaign.campaignx_politician_list && oneCampaign.campaignx_politician_list.length > 0) {
                oneCampaign.campaignx_politician_list.forEach((onePolitician) => {
                  politicianStateName = convertStateCodeToStateText(onePolitician.state_code);
                  foundInThisCampaignsPoliticians = (
                    foundInThisCampaignsPoliticians ||
                    // We should add this field on API server:
                    // onePolitician.contest_office_name.toLowerCase().includes(oneSearchWordLowerCase) ||
                    onePolitician.politician_name.toLowerCase().includes(oneSearchWordLowerCase) ||
                    politicianStateName.toLowerCase().includes(oneSearchWordLowerCase) ||
                    onePolitician.state_code.toLowerCase().includes(oneSearchWordLowerCase)
                  );
                });
              }
              thisWordFound = foundInThisCampaignsPoliticians;
            }
            if (isFirstWord) {
              foundInThisCampaign = thisWordFound;
              isFirstWord = false;
            } else {
              foundInThisCampaign = foundInThisCampaign && thisWordFound;
            }
          });
          return foundInThisCampaign;
        });
    }
    // console.log('onFilterOrListChange, campaignSearchResults:', campaignSearchResults);
    // console.log('onFilterOrListChange, filteredCampaignList:', filteredCampaignList);
    this.setState({
      campaignSearchResults,
      filteredCampaignList,
      timeStampOfChange: Date.now(),
    });
  }

  render () {
    renderLog('CampaignListRoot');  // Set LOG_RENDER_EVENTS to log all renders
    const { hideTitle, searchText, titleTextIfCampaigns } = this.props;
    const isSearching = searchText && searchText.length > 0;
    const { campaignList, campaignSearchResults, filteredCampaignList, timeStampOfChange } = this.state;

    if (!campaignList) {
      return null;
    }
    return (
      <CampaignListWrapper>
        {!!(!hideTitle &&
            titleTextIfCampaigns &&
            titleTextIfCampaigns.length &&
            campaignList) &&
        (
          <WhatIsHappeningTitle>
            {titleTextIfCampaigns}
          </WhatIsHappeningTitle>
        )}
        <CampaignCardList
          incomingCampaignList={(isSearching ? campaignSearchResults : filteredCampaignList)}
          timeStampOfChange={timeStampOfChange}
          verticalListOn
        />

        <Suspense fallback={<span>&nbsp;</span>}>
          <FirstCampaignListController />
        </Suspense>
      </CampaignListWrapper>
    );
  }
}
CampaignListRoot.propTypes = {
  hideTitle: PropTypes.bool,
  listModeFilters: PropTypes.array,
  listModeFiltersTimeStampOfChange: PropTypes.number,
  searchText: PropTypes.string,
  titleTextIfCampaigns: PropTypes.string,
};

const styles = () => ({
  iconButton: {
    padding: 8,
  },
});

const CampaignListWrapper = styled('div')`
`;

const WhatIsHappeningTitle = styled('h2')`
  font-size: 22px;
  text-align: left;
`;

export default withStyles(styles)(CampaignListRoot);