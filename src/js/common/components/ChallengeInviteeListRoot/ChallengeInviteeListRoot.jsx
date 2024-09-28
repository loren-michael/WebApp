import React, { Suspense } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { withStyles } from '@mui/styles';
import ChallengeInviteeList from './ChallengeInviteeList';
import FirstChallengeInviteeListController from './FirstChallengeInviteeListController';
import ChallengeInviteeStore from '../../stores/ChallengeInviteeStore';

const inviteeListDummyData = [
  { invitee_id: 1, invitee_name: 'Jane', invite_sent: false, invite_viewed: false, challenge_joined: false, messageStatus: '' },
  { invitee_id: 2, invitee_name: 'Unnamed friend1', invite_sent: true, invite_viewed: false, challenge_joined: false, messageStatus: 'Message Sent' },
  { invitee_id: 3, invitee_name: 'John', invite_sent: true, invite_viewed: true, challenge_joined: false, messageStatus: 'Message Viewed' },
  { invitee_id: 4, invitee_name: 'Melina H.', invite_sent: true, invite_viewed: true, challenge_joined: true, messageStatus: 'Challenge Joined' },
  { invitee_id: 5, invitee_name: 'Melina H.', invite_sent: true, invite_viewed: true, challenge_joined: true, messageStatus: 'Challenge Joined' },
  { invitee_id: 6, invitee_name: 'Melina H.', invite_sent: true, invite_viewed: true, challenge_joined: true, messageStatus: 'Challenge Joined' },
  { invitee_id: 7, invitee_name: 'Melina H.', invite_sent: false, invite_viewed: false, challenge_joined: false, messageStatus: '' },
  { invitee_id: 8, invitee_name: 'Melina H.', invite_sent: true, invite_viewed: true, challenge_joined: false, messageStatus: 'Message Viewed' },
  { invitee_id: 9, invitee_name: 'Melina H.', invite_sent: true, invite_viewed: true, challenge_joined: true, messageStatus: 'Challenge Joined' },
  { invitee_id: 10, invitee_name: 'Melina H.', invite_sent: true, invite_viewed: true, challenge_joined: true, messageStatus: 'Challenge Joined' },
  { invitee_id: 11, invitee_name: 'Melina H.', invite_sent: true, invite_viewed: false, challenge_joined: false, messageStatus: 'Message Sent' },
  { invitee_id: 12, invitee_name: 'Melina H.', invite_sent: true, invite_viewed: false, challenge_joined: false, messageStatus: 'Message Sent' },
];

const ChallengeInviteeListRoot = ({ challengeWeVoteId, classes }) => {
  // eslint-disable-next-line no-unused-vars
  const [inviteeList, setInviteeList] = React.useState([]);

  const onChallengeInviteeStoreChange = () => {
    setInviteeList(ChallengeInviteeStore.getChallengeInviteeList(challengeWeVoteId));
  };

  React.useEffect(() => {
    // console.log('Fetching participants for:', challengeWeVoteId);
    const storeListener = ChallengeInviteeStore.addListener(onChallengeInviteeStoreChange);
    onChallengeInviteeStoreChange();

    return () => {
      storeListener.remove();
    };
  }, [challengeWeVoteId]);
  return (
    <ChallengeInviteeListRootContainer>
      <Heading>
        <StyledP>Invited Friends</StyledP>
      </Heading>
      <ChallengeInviteeList
        challengeWeVoteId={challengeWeVoteId}
        // inviteeList={inviteeList}
        inviteeList={inviteeListDummyData}
      />
      <Suspense fallback={<></>}>
        <FirstChallengeInviteeListController challengeWeVoteId={challengeWeVoteId} searchText="SEARCH TEXT HERE" />
      </Suspense>
    </ChallengeInviteeListRootContainer>
  );
};
ChallengeInviteeListRoot.propTypes = {
  classes: PropTypes.object,
  challengeWeVoteId: PropTypes.string,
};

const styles = () => ({
  buttonDesktop: {
    padding: '2px 16px',
    borderRadius: 5,
  },
  searchButton: {
    borderRadius: 50,
  },
});

const ChallengeInviteeListRootContainer = styled.div`
  max-width: 100vw;
  margin: 0 auto;
`;

const Heading = styled.div`
  padding: 0 5px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const StyledP = styled.p`
  font-weight: bold;
  padding: 10px;
`;

export default withStyles(styles)(ChallengeInviteeListRoot);
