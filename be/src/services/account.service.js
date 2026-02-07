import Account from "../models/Account.js";
import { PROFILE_MODEL_BY_ROLE } from "../constants/ProfileModel.enum.js";
import { buildPagination, getPaginationMetadata } from "../utils/pagination.js";

export const getAccountsWithProfiles = async ({
  query = {},
  roleNames = null,
  accountSelectFields = "_id email role status isVerified createdAt",
  profileSelectFields = "accountId fullName phone gender dateOfBirth address",
  rolePopulateFields = "name",
  page,
  limit,
}) => {
  // ===== pagination =====
  const { limit: safeLimit, offset } = buildPagination({ page, limit });

  // ===== fetch accounts =====
  const [accounts, total] = await Promise.all([
    Account.find(query)
      .select(accountSelectFields)
      .populate("role", rolePopulateFields)
      .skip(offset)
      .limit(safeLimit)
      .lean(),
    Account.countDocuments(query),
  ]);

  if (accounts.length === 0) {
    return {
      data: [],
      metadata: getPaginationMetadata(0, total, safeLimit, offset),
    };
  }

  // ===== load profiles =====
  let profileMap = new Map();

  if (roleNames) {
    // Normalize to array
    const roleNamesArray = Array.isArray(roleNames) ? roleNames : [roleNames];
    const accountIds = accounts.map((a) => a._id);

    // Load profiles from all relevant models
    const profilePromises = roleNamesArray
      .filter((roleName) => PROFILE_MODEL_BY_ROLE[roleName])
      .map((roleName) => {
        const ProfileModel = PROFILE_MODEL_BY_ROLE[roleName];
        return ProfileModel.find({
          accountId: { $in: accountIds },
        })
          .select(profileSelectFields)
          .lean();
      });

    const profilesArrays = await Promise.all(profilePromises);
    const allProfiles = profilesArrays.flat();

    profileMap = new Map(allProfiles.map((p) => [p.accountId.toString(), p]));
  }

  // ===== merge =====
  const data = accounts.map((acc) => ({
    ...acc,
    profile: profileMap.get(acc._id.toString()) || null,
  }));

  return {
    data,
    metadata: getPaginationMetadata(data.length, total, safeLimit, offset),
  };
};
