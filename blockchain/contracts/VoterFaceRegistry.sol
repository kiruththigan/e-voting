// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VoterFaceRegistry {
    struct FaceRecord {
        string faceHash;
        uint256 enrolledAt;
    }

    struct Verification {
        uint256 time;
    }

    mapping(string => FaceRecord) public faces;
    mapping(string => Verification[]) public verifications;

    event FaceEnrolled(string userId, string faceHash, uint256 time);
    event FaceVerified(string userId, uint256 time);

    function enrollFace(string memory userId, string memory faceHash) external {
        faces[userId] = FaceRecord({
            faceHash: faceHash,
            enrolledAt: block.timestamp
        });

        emit FaceEnrolled(userId, faceHash, block.timestamp);
    }

    function addVerification(string memory userId) external {
        verifications[userId].push(
            Verification({time: block.timestamp})
        );

        emit FaceVerified(userId, block.timestamp);
    }

    function getVerificationCount(string memory userId) external view returns (uint256) {
        return verifications[userId].length;
    }
}
