"use server";

import mongoose, { FilterQuery, SortOrder } from "mongoose";
import { revalidatePath } from "next/cache";
import { connectToDB } from "../moongose";
import User from "../models/user.model";
import Thread from "../models/thread.model";
import Community from "../models/community.model";

export async function fetchPosts({
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}) {
  try {
    connectToDB();

    // Calculate the number of posts to skip based on the page number and page size.
    const skipAmount = (pageNumber - 1) * pageSize;
    const regex = new RegExp(searchString, "i");
    // Create a query to fetch the posts that have no parent (top-level threads) (a thread that is not a comment/reply).
    const query: FilterQuery<typeof Thread> = {
      parentId: { $in: [null, undefined] },
    };

    // If the search string is not empty, add a filter for the content field.
    if (searchString.trim() !== "") {
      query.$or = [
        { text: { $regex: regex } },
        { text: { $regex: regex } },
      ];
    }
    

    // Define the sort options for the fetched posts based on createdAt field.
    const sortOptions = { createdAt: sortBy };

    const postsQuery = Thread.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize)
      .populate({
        path: "author",
        model: User,
      })
      .populate({
        path: "community",
        model: Community,
      })
      .populate({
        path: "children",
        populate: {
          path: "author",
          model: User,
          select: "_id name parentId image",
        },
      });

    // Count the total number of top-level posts (threads) i.e., threads that are not comments.
    const totalPostsCount = await Thread.countDocuments(query);

    const posts = await postsQuery.exec();

    const isNext = totalPostsCount > skipAmount + posts.length;

    return { posts, isNext };
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }
}

interface Params {
  text: string,
  images: string[],
  author: string,
  communityId: string | null,
  path: string,
}

export async function createThread({ text, images, author, communityId, path }: Params) {
  try {
    connectToDB();

    const communityIdObject = await Community.findOne(
      { id: communityId },
      { _id: 1 }
    );

    const createdThread = await Thread.create({
      text,
      images,
      author,
      community: communityIdObject, // Assign communityId if provided, or leave it null for personal account
    });

    // Update User model
    await User.findByIdAndUpdate(author, {
      $push: { threads: createdThread._id },
    });

    if (communityIdObject) {
      // Update Community model
      await Community.findByIdAndUpdate(communityIdObject, {
        $push: { threads: createdThread._id },
      });
    }

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to create thread: ${error.message}`);
  }
}

async function fetchAllChildThreads(threadId: string): Promise<any[]> {
  const childThreads = await Thread.find({ parentId: threadId });

  const descendantThreads = [];
  for (const childThread of childThreads) {
    const descendants = await fetchAllChildThreads(childThread._id);
    descendantThreads.push(childThread, ...descendants);
  }

  return descendantThreads;
}

export async function deleteThread(id: string, path: string): Promise<void> {
  try {
    connectToDB();

    // Find the thread to be deleted (the main thread)
    const mainThread = await Thread.findById(id).populate("author community");

    if (!mainThread) {
      throw new Error("Thread not found");
    }

    // Fetch all child threads and their descendants recursively
    const descendantThreads = await fetchAllChildThreads(id);

    // Get all descendant thread IDs including the main thread ID and child thread IDs
    const descendantThreadIds = [
      id,
      ...descendantThreads.map((thread) => thread._id),
    ];

    // Extract the authorIds and communityIds to update User and Community models respectively
    const uniqueAuthorIds = new Set(
      [
        ...descendantThreads.map((thread) => thread.author?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainThread.author?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    const uniqueCommunityIds = new Set(
      [
        ...descendantThreads.map((thread) => thread.community?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainThread.community?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    // Recursively delete child threads and their descendants
    await Thread.deleteMany({ _id: { $in: descendantThreadIds } });

    // Update User model
    await User.updateMany(
      { _id: { $in: Array.from(uniqueAuthorIds) } },
      { $pull: { threads: { $in: descendantThreadIds } } }
    );

    // Update Community model
    await Community.updateMany(
      { _id: { $in: Array.from(uniqueCommunityIds) } },
      { $pull: { threads: { $in: descendantThreadIds } } }
    );

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to delete thread: ${error.message}`);
  }
}

export async function fetchThreadById(threadId: string) {
  connectToDB();

  try {
    const thread = await Thread.findById(threadId)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      }) // Populate the author field with _id and username
      .populate({
        path: "community",
        model: Community,
        select: "_id id name image",
      }) // Populate the community field with _id and name
      .populate({
        path: "children", // Populate the children field
        populate: [
          {
            path: "author", // Populate the author field within children
            model: User,
            select: "_id id name parentId image", // Select only _id and username fields of the author
          },
          {
            path: "children", // Populate the children field within children
            model: Thread, // The model of the nested children (assuming it's the same "Thread" model)
            populate: {
              path: "author", // Populate the author field within nested children
              model: User,
              select: "_id id name parentId image", // Select only _id and username fields of the author
            },
          },
        ],
      })
      .exec();

    return thread;
  } catch (err) {
    console.error("Error while fetching thread:", err);
    throw new Error("Unable to fetch thread");
  }
}

export async function addCommentToThread(
  threadId: string,
  commentText: string,
  userId: string,
  path: string
) {
  connectToDB();

  try {
    // Find the original thread by its ID
    const originalThread = await Thread.findById(threadId);

    if (!originalThread) {
      throw new Error("Thread not found");
    }

    // Create the new comment thread
    const commentThread = new Thread({
      text: commentText,
      author: userId,
      parentId: threadId, // Set the parentId to the original thread's ID
    });

    // Save the comment thread to the database
    const savedCommentThread = await commentThread.save();

    // Add the comment thread's ID to the original thread's children array
    originalThread.children.push(savedCommentThread._id);

    // Save the updated original thread to the database
    await originalThread.save();

    revalidatePath(path);
  } catch (err) {
    console.error("Error while adding comment:", err);
    throw new Error("Unable to add comment");
  }
}

export async function unlikeThread(
  userId: string ,
  threadId: any
) {
  await connectToDB();

  try {

    let actualUserId;

    if (typeof userId === 'object') {
      const { id: extractedId } = userId || {};
      if (extractedId) {
        console.log("extractedId:", extractedId);
        actualUserId = extractedId;
      } else {
        throw new Error("Missing user ID in request");
      }
    } else {
      actualUserId = userId;
    }

    const convertedUserId = new mongoose.Types.ObjectId(actualUserId);

    const thread = await Thread.findById({_id: threadId}).exec();
    console.log('Thread:', thread);

    if (!thread) {
      throw new Error("Invalid threadId");
    }

    await thread.updateOne({ $pull: { likes: convertedUserId } });
    return { message: "Thread unliked successfully" };
  } catch (error) {
    console.error("An error occurred while unliking thread:", error);
    throw new Error("Failed to unlike thread");
  }
}


export async function likeThread(
  userId: string,
  threadId: string,
) {
  await connectToDB();

  try {
    let actualUserId;

    if (typeof userId === 'object') {
      const { id: extractedId } = userId || {};
      if (extractedId) {
        console.log("extractedId:", extractedId);
        actualUserId = extractedId;
      } else {
        throw new Error("Missing user ID in request");
      }
    } else {
      actualUserId = userId;
    }

    const convertedUserId = new mongoose.Types.ObjectId(actualUserId);

    const thread = await Thread.findById({_id: threadId}).exec();
    console.log('Thread:', thread);

    if (!thread) {
      throw new Error("Invalid threadId");
    }

    await thread.updateOne({ $addToSet: { likes: convertedUserId } });
    return { message: "Thread liked successfully" };
  } catch (error) {
    console.error("An error occurred while liking thread:", error);
    if (error) {
      throw new Error("Invalid user ID format");
    } else {
      throw new Error("Failed to like thread");
    }
  }
}



export async function getLikes(
  threadId: string
) {
  await connectToDB();

  try {

    const thread = await Thread.findById(threadId);

    if (!thread) {
      return { error: "Thread not found" };
    }

    const likes = thread.likes;
    return likes;
    
  } catch (error) {
    console.error("An error occurred while fetching likes:", error);
    throw new Error("Failed to fetch likes");
  }
}

