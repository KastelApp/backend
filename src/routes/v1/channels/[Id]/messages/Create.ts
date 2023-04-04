import { HTTPErrors, Route, Snowflake } from "@kastelll/packages";
import Constants, { MessageFlags } from "../../../../../Constants";
import User from "../../../../../Middleware/User";
import FlagRemover from "../../../../../Utils/Classes/BitFields/FlagRemover";
import Encryption from "../../../../../Utils/Classes/Encryption";
import schemaData from "../../../../../Utils/SchemaData";
import { MessageSchema } from "../../../../../Utils/Schemas/Schemas";

interface MessageBody {
  content: string;
  allowedMentions: number;
  nonce: string;
  flags: number;
  embeds: {
    title?: string;
    description?: string;
    color?: number;
    timestamp?: number;
    footer?: {
      text: string;
    };
    fields?: {
      title: string;
      value: string;
    }[];
  }[];
  replyingTo?: string;
}

new Route(
  "/",
  "POST",
  [
    User({
      AccessType: "LoggedIn",
      AllowedRequesters: "All",
      Flags: [],
    }),
  ],
  async (req, res) => {
    const { content, nonce, replyingTo, allowedMentions } = req.body as MessageBody;
    const { Id } = req.params as { Id: string };

    const CommonErrors = new HTTPErrors(4050);

    if (!content)
      CommonErrors.addError({
        Content: {
          code: "MissingContent",
          message: "The content of the message is missing.",
        },
      });

    if (content?.length > Constants.Settings.Max.MessageLength)
      CommonErrors.addError({
        Content: {
          code: "MessageTooLong",
          message: "The message is too long.",
        },
      });

    if (Object.keys(CommonErrors.errors).length > 0) {
        res.status(400).json(CommonErrors.toJSON());
        
        return;
    }

    if (nonce) {
      const NonceExists = await MessageSchema.exists({
        Channel: Id,
        Nonce: nonce,
        Author: req.user.Id,
      });

      if (NonceExists)
        CommonErrors.addError({
          Nonce: {
            code: "NonceExists",
            message: "The nonce you provided already exists.",
          },
        });

      if (Object.keys(CommonErrors.errors).length > 0) {
        res.status(400).json(CommonErrors.toJSON());
        
        return;
      }
    }

    const CanSend = await req.mutils.Channel.hasPermission(Id, [
      'SendMessages',
      'Administrator'
    ], true);

    if (!CanSend) {
      const MissingPermissions = new HTTPErrors(4021);

      MissingPermissions.addError({
        Content: {
          code: "UnknownChannel",
          message: "The channel you are trying to send a message to does not exist or you do not have permission to send messages to it.",
        },
      });

      res.status(403).json(MissingPermissions.toJSON());

      return;
    }

    const FetchedAuthor = await req.mutils.User.getMemberFromChannel(Id, req.user.Id);

    if (!FetchedAuthor) {
      throw new HTTPErrors(4050).addError({
        GuildMember: {
          code: "UnknownMember",
          message: "The Member that tried to send a message does not exist.",
        },
      });
    }

    const Message = new MessageSchema({
      _id: Encryption.encrypt(Snowflake.generate()),
      Channel: Encryption.encrypt(Id),
      Author: Encryption.encrypt(FetchedAuthor._id),
      Content: Encryption.encrypt(content),
      Nonce: Encryption.encrypt(nonce),
      CreatedDate: Date.now(),
      Flags: replyingTo ? MessageFlags.Reply : MessageFlags.Normal,
      ReplyingTo: replyingTo ? Encryption.encrypt(replyingTo) : null,
      AllowedMentions: allowedMentions
    });

    await Message.save();

    const Schemad = schemaData('Message', Encryption.completeDecryption({
      ...Message.toJSON(),
      Author: FetchedAuthor,
    }));

    const FixedData = {
      ...Schemad,
      Author: {
        ...Schemad.Author,
        User: {
          ...Schemad.Author.User,
          PublicFlags: Number(FlagRemover.NormalFlags(BigInt(FetchedAuthor?.Flags || 0))),
        },
      }
    }

    res.json(FixedData);

    req.app.socket.Events.MessageCreate({
      ...FixedData,
      ChannelId: Id,
    })
  }
);
